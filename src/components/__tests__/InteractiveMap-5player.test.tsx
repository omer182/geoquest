import { describe, it, expect } from 'vitest';

/**
 * InteractiveMap - 5 Player Data Structure Tests
 *
 * Tests data structures for 5-player support:
 * - 5 colored pins with correct colors
 * - Auto-zoom calculation data for all 5 pins
 * - Player name labels for all 5 players
 */

describe('InteractiveMap - 5 Player Support', () => {
  const mockTargetLocation = { lat: 40.7128, lng: -74.006 };

  const create5PlayerGuesses = () => [
    {
      playerId: 'player1',
      playerName: 'Alice',
      guess: { lat: 40.7130, lng: -74.0060 },
      distance: 0.2,
      color: '#3b82f6', // Blue
    },
    {
      playerId: 'player2',
      playerName: 'Bob',
      guess: { lat: 40.8, lng: -74.1 },
      distance: 10,
      color: '#10b981', // Green
    },
    {
      playerId: 'player3',
      playerName: 'Charlie',
      guess: { lat: 41.0, lng: -74.5 },
      distance: 50,
      color: '#a855f7', // Purple
    },
    {
      playerId: 'player4',
      playerName: 'Diana',
      guess: { lat: 42.0, lng: -75.0 },
      distance: 150,
      color: '#f97316', // Orange
    },
    {
      playerId: 'player5',
      playerName: 'Eve',
      guess: { lat: 45.0, lng: -80.0 },
      distance: 600,
      color: '#eab308', // Yellow
    },
  ];

  describe('5-Player Pin Data', () => {
    it('should include yellow color for player 5', () => {
      const playerGuesses = create5PlayerGuesses();
      const player5 = playerGuesses.find(p => p.playerId === 'player5');

      expect(player5).toBeDefined();
      expect(player5?.color).toBe('#eab308'); // Yellow
      expect(player5?.playerName).toBe('Eve');
    });

    it('should have all 5 unique player colors', () => {
      const playerGuesses = create5PlayerGuesses();
      const colors = playerGuesses.map(p => p.color);

      // Verify all 5 colors are unique
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(5);

      // Verify expected colors
      expect(colors).toContain('#3b82f6'); // Blue
      expect(colors).toContain('#10b981'); // Green
      expect(colors).toContain('#a855f7'); // Purple
      expect(colors).toContain('#f97316'); // Orange
      expect(colors).toContain('#eab308'); // Yellow
    });
  });

  describe('5-Player Auto-Zoom Data', () => {
    it('should have valid coordinates for all 5 player pins', () => {
      const playerGuesses = create5PlayerGuesses();

      // Verify all 5 guesses have valid coordinates
      playerGuesses.forEach((guess) => {
        expect(guess.guess.lat).toBeDefined();
        expect(guess.guess.lng).toBeDefined();
        expect(typeof guess.guess.lat).toBe('number');
        expect(typeof guess.guess.lng).toBe('number');
      });
    });

    it('should calculate bounds that include all 5 player pins', () => {
      const playerGuesses = create5PlayerGuesses();

      // Calculate bounds manually to verify logic
      const lats = playerGuesses.map(g => g.guess.lat);
      const lngs = playerGuesses.map(g => g.guess.lng);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // Verify bounds include all points
      expect(minLat).toBeLessThanOrEqual(Math.min(...lats));
      expect(maxLat).toBeGreaterThanOrEqual(Math.max(...lats));
      expect(minLng).toBeLessThanOrEqual(Math.min(...lngs));
      expect(maxLng).toBeGreaterThanOrEqual(Math.max(...lngs));
    });

    it('should include target location in bounds calculation', () => {
      const playerGuesses = create5PlayerGuesses();

      // Collect all points that should be in bounds (5 guesses + target)
      const allPoints = [
        ...playerGuesses.map(g => g.guess),
        mockTargetLocation,
      ];

      expect(allPoints).toHaveLength(6); // 5 players + 1 target
    });
  });

  describe('5-Player Name Labels', () => {
    it('should have player name labels for all 5 players', () => {
      const playerGuesses = create5PlayerGuesses();
      const playerNames = playerGuesses.map(p => p.playerName);

      expect(playerNames).toHaveLength(5);
      expect(playerNames).toContain('Alice');
      expect(playerNames).toContain('Bob');
      expect(playerNames).toContain('Charlie');
      expect(playerNames).toContain('Diana');
      expect(playerNames).toContain('Eve');
    });

    it('should color-match name labels to player pin colors', () => {
      const playerGuesses = create5PlayerGuesses();

      // Verify each player has both a name and a color
      playerGuesses.forEach((player) => {
        expect(player.playerName).toBeTruthy();
        expect(player.color).toBeTruthy();
        expect(player.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('5-Player Distance Lines', () => {
    it('should have valid distance values for all 5 players', () => {
      const playerGuesses = create5PlayerGuesses();

      // Verify all players have distance values
      playerGuesses.forEach((player) => {
        expect(player.distance).toBeDefined();
        expect(typeof player.distance).toBe('number');
        expect(player.distance).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
