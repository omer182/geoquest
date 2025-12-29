/**
 * Represents a city location with geographic coordinates and difficulty tier.
 */
export interface City {
  /** The name of the city */
  name: string;

  /** The country where the city is located */
  country: string;

  /** Latitude coordinate in decimal degrees */
  latitude: number;

  /** Longitude coordinate in decimal degrees */
  longitude: number;

  /**
   * Difficulty tier for level progression
   * Tier 1: Well-known major cities (easier)
   * Tier 2: Moderately known cities (medium difficulty)
   * Tier 3: Lesser-known cities (harder)
   */
  tier: number;
}
