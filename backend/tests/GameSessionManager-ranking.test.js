import { describe, it, expect, afterEach } from 'vitest';
import { GameSessionManager } from '../services/GameSessionManager.js';

describe('GameSession ranking', () => {
  const manager = new GameSessionManager();
  const cities = [
    { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, level: 1, scaleKm: 400 },
    { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, level: 1, scaleKm: 300 },
  ];
  const players = [
    { id: 'fast', name: 'Fast' },
    { id: 'accurate', name: 'Accurate' },
  ];

  afterEach(() => {
    manager.sessions.forEach((s) => s.destroy());
    manager.sessions.clear();
  });

  // Same total, but "accurate" earned more of it from guessing rather than speed bonuses
  function sessionWithTiedTotals() {
    const session = manager.createSession('TIE01', cities, 'easy', 30, players);
    const fast = session.playerScores.get('fast');
    fast.totalScore = 1200;
    fast.roundScores = [960];
    fast.roundDistances = [30];
    const accurate = session.playerScores.get('accurate');
    accurate.totalScore = 1200;
    accurate.roundScores = [1000];
    accurate.roundDistances = [5];
    return session;
  }

  it('breaks total-score ties in standings by accuracy', () => {
    const standings = sessionWithTiedTotals().getStandings();
    expect(standings.map((s) => s.playerId)).toEqual(['accurate', 'fast']);
    expect(standings[0]).not.toHaveProperty('accuracy');
  });

  it('breaks total-score ties for the winner by accuracy', () => {
    const { finalStandings, winner } = sessionWithTiedTotals().getFinalStandings();
    expect(winner.playerId).toBe('accurate');
    expect(finalStandings.map((s) => s.playerId)).toEqual(['accurate', 'fast']);
  });

  it('ranks far misses that both score 0 by distance', () => {
    const session = manager.createSession('FAR01', cities, 'easy', 30, players);
    session.startRound();
    // Both guess the other side of the world from Paris; "accurate" is a bit closer
    session.addGuess('fast', { lat: -45, lng: 170 }, Date.now());
    session.addGuess('accurate', { lat: -30, lng: 150 }, Date.now());
    const results = session.calculateRoundResults();
    expect(results.every((r) => r.score === 0)).toBe(true);
    expect(results.map((r) => r.playerId)).toEqual(['accurate', 'fast']);
    expect(session.getStandings()[0].playerId).toBe('accurate');
    expect(session.getFinalStandings().winner.playerId).toBe('accurate');
  });

  it('ranks a missed round (no pin) below a far guess', () => {
    const session = manager.createSession('NOP01', cities, 'easy', 30, players);
    session.startRound();
    session.addGuess('accurate', { lat: -45, lng: 170 }, Date.now());
    session.autoSubmitMissingGuesses();
    expect(session.calculateRoundResults()[0].playerId).toBe('accurate');
    expect(session.getFinalStandings().winner.playerId).toBe('accurate');
  });

  it('scores multiplayer guesses with the city scale, same as single player', () => {
    const session = manager.createSession('SCL01', cities, 'easy', 30, players);
    session.startRound();
    // ~100 km from Paris
    const result = session.addGuess('fast', { lat: 49.75, lng: 2.35 }, Date.now());
    expect(result.score).toBeGreaterThan(750);
    expect(result.score).toBeLessThan(830);
  });
});
