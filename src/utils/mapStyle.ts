/**
 * Map colours shared by the game map (Leaflet) and the menu backdrop (canvas).
 */

/**
 * Pastel fills indexed by Natural Earth's MAPCOLOR7 property (1-7).
 * Natural Earth precomputes MAPCOLOR7 so that neighbouring countries never
 * share a value, which replaces the old runtime four-colour adjacency search.
 */
export const COUNTRY_COLORS: Record<number, string> = {
  1: '#F6D9B4', // Sand
  2: '#E9CDE2', // Rose lavender
  3: '#CDE7C4', // Mint
  4: '#FAEDB8', // Cream
  5: '#F3C9B9', // Blush
  6: '#DAD3EF', // Lilac
  7: '#DDE9B6', // Pistachio
};

export const OCEAN_COLOR = '#8FC3E6';
