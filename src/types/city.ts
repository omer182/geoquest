/**
 * Represents a city location with geographic coordinates and difficulty.
 */
export interface City {
  /** The name of the city */
  name: string;

  /** The country where the city is located (always shown to the player) */
  country: string;

  /** Latitude coordinate in decimal degrees */
  latitude: number;

  /** Longitude coordinate in decimal degrees */
  longitude: number;

  /** Difficulty level 1-10 (1 = famous and easy to place, 10 = obscure) */
  level: number;

  /**
   * Score decay distance in km, proportional to the size of the city's country.
   * See calculateScore in utils/scoring.ts.
   */
  scaleKm: number;
}
