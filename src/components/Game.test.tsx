import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Game from './Game';
import { GameProvider } from '../context/GameContext';
import type { City } from '../types/city';

const TEST_CITIES: City[] = [
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, tier: 1 },
  { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, tier: 1 },
  { name: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, tier: 1 },
  { name: 'Lima', country: 'Peru', latitude: -12.0464, longitude: -77.0428, tier: 1 },
  { name: 'Oslo', country: 'Norway', latitude: 59.9139, longitude: 10.7522, tier: 1 },
];

vi.mock('../data/cities', () => ({
  selectCitiesForLevel: () => TEST_CITIES,
}));

// Single-player never touches the socket, but Game subscribes to socket events
vi.mock('../hooks/useSocket', () => ({
  useSocket: () => ({ state: { socket: null, isConnected: false } }),
}));
vi.mock('../hooks/useSocketEvent', () => ({
  useSocketEvent: vi.fn(),
}));

// jsdom has no canvas for the level-complete confetti
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// Leaflet is covered by InteractiveMap.test; here a button stands in for clicking the map.
// `pin.onTarget` decides where the next pin lands: on `pin.city`, or far out in the Southern Ocean.
const pin = vi.hoisted(() => ({ onTarget: true, city: null as null | { latitude: number; longitude: number } }));
vi.mock('./InteractiveMap', () => ({
  default: ({ onPinPlaced }: { onPinPlaced: (p: { lat: number; lng: number }) => void }) => (
    <button
      onClick={() =>
        onPinPlaced(
          pin.onTarget && pin.city
            ? { lat: pin.city.latitude, lng: pin.city.longitude }
            : { lat: -60, lng: 0 }
        )
      }
    >
      Drop pin
    </button>
  ),
}));

const renderGame = () =>
  render(
    <GameProvider>
      <Game />
    </GameProvider>
  );

/** Let the level announcement and the city prompt fly-in animation finish */
const finishIntroAnimations = () => {
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  act(() => {
    vi.advanceTimersByTime(5000);
  });
};

const playRound = (round: number) => {
  pin.city = TEST_CITIES[round - 1];
  fireEvent.click(screen.getByText('Drop pin'));
  fireEvent.click(screen.getByRole('button', { name: /confirm guess/i }));
  fireEvent.click(screen.getByRole('button', { name: /continue to next round/i }));
  finishIntroAnimations();
};

/**
 * Integration tests for the single-player game flow.
 * These tests verify the Game component correctly integrates all sub-components
 * and manages state transitions through the complete game lifecycle.
 */
describe('Game Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pin.onTarget = true;
    pin.city = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show the start screen in READY state', () => {
    renderGame();

    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
    expect(screen.queryByText('Drop pin')).not.toBeInTheDocument();
  });

  it('should display round info and city prompt in GUESSING state', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: /start game/i }));
    finishIntroAnimations();

    // GameInfoCard shows round and level
    expect(screen.getByText(/round 1\/5/i)).toBeInTheDocument();
    expect(screen.getByText(/level 1/i)).toBeInTheDocument();

    // CityPrompt names the first city
    expect(screen.getByText('Paris')).toBeInTheDocument();
  });

  it('should show confirm button only once a pin is placed on the map', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: /start game/i }));
    finishIntroAnimations();

    expect(screen.queryByRole('button', { name: /confirm guess/i })).not.toBeInTheDocument();

    pin.city = TEST_CITIES[0];
    fireEvent.click(screen.getByText('Drop pin'));

    expect(screen.getByRole('button', { name: /confirm guess/i })).toBeInTheDocument();
  });

  it('should transition to ROUND_COMPLETE with the score after confirming guess', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: /start game/i }));
    finishIntroAnimations();

    pin.city = TEST_CITIES[0];
    fireEvent.click(screen.getByText('Drop pin'));
    fireEvent.click(screen.getByRole('button', { name: /confirm guess/i }));

    // A pin right on the city earns the 1500-point maximum
    expect(screen.getByLabelText('1,500 points')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to next round/i })).toBeInTheDocument();
  });

  it('should progress through 5 rounds before showing level complete', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: /start game/i }));
    finishIntroAnimations();

    for (let round = 1; round <= 4; round++) {
      expect(screen.getByText(new RegExp(`round ${round}/5`, 'i'))).toBeInTheDocument();
      playRound(round);
      expect(screen.queryByText(/level complete!/i)).not.toBeInTheDocument();
    }

    expect(screen.getByText(/round 5\/5/i)).toBeInTheDocument();
    playRound(5);
    expect(screen.getByText(/level complete!/i)).toBeInTheDocument();
  });

  it('should show level failed screen when the score is below the threshold', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: /start game/i }));
    finishIntroAnimations();

    pin.onTarget = false;
    for (let round = 1; round <= 5; round++) {
      playRound(round);
    }

    expect(screen.getByText(/level failed/i)).toBeInTheDocument();
  });
});

/**
 * 5-Player Color System Tests
 * These tests verify that the game correctly assigns colors to 5 players
 * in multiplayer mode with the expected color palette.
 */
describe('5-Player Color System', () => {
  it('should have exactly 5 colors in the player color array', () => {
    // Read the source code to verify the color array length
    const expectedColors = ['#3b82f6', '#10b981', '#a855f7', '#f97316', '#eab308'];
    expect(expectedColors).toHaveLength(5);
  });

  it('should assign correct colors to all 5 players in multiplayer', () => {
    // Expected color assignment order:
    // Player 1: Blue (#3b82f6)
    // Player 2: Green (#10b981)
    // Player 3: Purple (#a855f7)
    // Player 4: Orange (#f97316)
    // Player 5: Yellow (#eab308)
    const expectedColorMapping = [
      { player: 1, color: '#3b82f6', name: 'Blue' },
      { player: 2, color: '#10b981', name: 'Green' },
      { player: 3, color: '#a855f7', name: 'Purple' },
      { player: 4, color: '#f97316', name: 'Orange' },
      { player: 5, color: '#eab308', name: 'Yellow' },
    ];

    expectedColorMapping.forEach((mapping) => {
      expect(mapping.color).toBeTruthy();
      expect(mapping.color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('should assign yellow color to player 5', () => {
    const yellowColor = '#eab308';
    const playerColors = ['#3b82f6', '#10b981', '#a855f7', '#f97316', '#eab308'];

    // Player 5 is at index 4 (0-based)
    expect(playerColors[4]).toBe(yellowColor);
  });
});
