import { useEffect, useRef, useState } from 'react';
import { VIEW_W } from './regionProjection';

/** Zoom level and the map point at the centre of the screen */
export interface View { s: number; cx: number; cy: number }
/** The window size at zoom 1: the whole map, padded out to the container's shape */
export interface Base { w: number; h: number }

const MAX_ZOOM = 8;

/**
 * Pan & zoom for an SVG map (drag, pinch, wheel, buttons) projected VIEW_W wide.
 * The viewBox always has the container's aspect ratio, so the map fills the
 * screen; zooming and panning just move/resize that window over the map.
 * A tap (no drag) on an element with data-iso calls onTap.
 */
export function useMapView({
  viewH,
  ready,
  onTap,
  initial,
}: {
  viewH: number;
  /** The map is drawn (attach observers once it is) */
  ready: boolean;
  onTap: (iso: string) => void;
  /** Opening view, given the zoom-1 window and a clamp helper */
  initial: (base: Base, clamp: (v: View) => View) => View;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState({ w: 360, h: 640 });
  const [view, setView] = useState<View>({ s: 1, cx: VIEW_W / 2, cy: viewH / 2 });
  const tapRef = useRef(onTap);
  tapRef.current = onTap;
  const initialRef = useRef(initial);
  initialRef.current = initial;

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setBox({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  const aspect = box.h / box.w;
  const base: Base = aspect * VIEW_W >= viewH ? { w: VIEW_W, h: VIEW_W * aspect } : { w: viewH / aspect, h: viewH };

  const clampView = (v: View): View => {
    const s = Math.min(Math.max(v.s, 1), MAX_ZOOM);
    const w = base.w / s;
    const h = base.h / s;
    const cx = w >= VIEW_W ? VIEW_W / 2 : Math.min(Math.max(v.cx, w / 2), VIEW_W - w / 2);
    const cy = h >= viewH ? viewH / 2 : Math.min(Math.max(v.cy, h / 2), viewH - h / 2);
    return { s, cx, cy };
  };

  // Re-fit when the map loads or the screen changes shape, until the player moves it
  const userMoved = useRef(false);
  const reset = () => {
    userMoved.current = false;
    setView(initialRef.current(base, clampView));
  };
  useEffect(() => {
    if (!userMoved.current) setView(initialRef.current(base, clampView));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.w, box.h, viewH]);

  const cur = clampView(view);
  const vb = { w: base.w / cur.s, h: base.h / cur.s, x: cur.cx - base.w / cur.s / 2, y: cur.cy - base.h / cur.s / 2 };
  /** Map units per screen pixel */
  const unitsPerPx = vb.w / box.w;

  const toMap = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: vb.x + ((clientX - r.left) / r.width) * vb.w, y: vb.y + ((clientY - r.top) / r.height) * vb.h };
  };

  const zoomAt = (factor: number, mx: number, my: number, from: View = view) => {
    const c = clampView(from);
    const s = Math.min(Math.max(c.s * factor, 1), MAX_ZOOM);
    const k = c.s / s; // new window size relative to the old one
    return clampView({ s, cx: mx + (c.cx - mx) * k, cy: my + (c.cy - my) * k });
  };

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    moved: boolean;
    downIso: string | null;
    startDist: number;
    startView: View;
    startMid: { x: number; y: number };
    origin: { x: number; y: number };
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const iso = (e.target as Element).closest('[data-iso]')?.getAttribute('data-iso') ?? null;
    if (pointers.current.size === 1) {
      gesture.current = { moved: false, downIso: iso, startDist: 0, startView: view, startMid: { x: 0, y: 0 }, origin: { x: e.clientX, y: e.clientY } };
    } else if (pointers.current.size === 2 && gesture.current) {
      const [p1, p2] = [...pointers.current.values()];
      gesture.current = {
        ...gesture.current,
        moved: true,
        startDist: Math.hypot(p1.x - p2.x, p1.y - p2.y),
        startView: view,
        startMid: toMap((p1.x + p2.x) / 2, (p1.y + p2.y) / 2),
      };
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* not supported */
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      userMoved.current = true;
      setView(zoomAt(dist / (g.startDist || dist), g.startMid.x, g.startMid.y, g.startView));
      return;
    }
    if (!g.moved && Math.hypot(e.clientX - g.origin.x, e.clientY - g.origin.y) < 8) return;
    g.moved = true;
    userMoved.current = true;
    const k = vb.w / svgRef.current!.getBoundingClientRect().width;
    const dx = (e.clientX - prev.x) * k;
    const dy = (e.clientY - prev.y) * k;
    setView(v => {
      const c = clampView(v);
      return clampView({ s: c.s, cx: c.cx - dx, cy: c.cy - dy });
    });
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;
    if (g && !g.moved && g.downIso) tapRef.current(g.downIso);
    gesture.current = null;
  };

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const m = toMap(e.clientX, e.clientY);
    userMoved.current = true;
    setView(zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, m.x, m.y));
  };

  const zoomButton = (factor: number) => {
    userMoved.current = true;
    setView(zoomAt(factor, cur.cx, cur.cy));
  };

  // Keep wheel zoom from scrolling the page
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const stop = (ev: Event) => ev.preventDefault();
    el.addEventListener('wheel', stop, { passive: false });
    return () => el.removeEventListener('wheel', stop);
  }, [ready]);

  return {
    boxRef,
    svgRef,
    viewBox: `${vb.x} ${vb.y} ${vb.w} ${vb.h}`,
    unitsPerPx,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onWheel },
    zoomButton,
    reset,
  };
}
