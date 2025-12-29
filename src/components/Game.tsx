import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { GameStatus } from '../types/game';
import { selectCitiesForLevel } from '../data/cities';
import { calculateDistance } from '../utils/distance';
import { calculateScore, getLevelThreshold } from '../utils/scoring';
import { useSocket } from '../hooks/useSocket';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { SOCKET_EVENTS } from '../types/socket-events';
import { toast } from 'sonner';
import InteractiveMap from './InteractiveMap';
import GameInfoCard from './GameInfoCard';
import CityPrompt from './CityPrompt';
import LevelAnnouncement from './LevelAnnouncement';
import ConfirmButton from './ConfirmButton';
import RoundResults from './RoundResults';
import LevelComplete from './LevelComplete';
import MultiplayerTimer from './MultiplayerTimer';
import WaitingIndicator from './WaitingIndicator';
import MultiplayerRoundResults from './MultiplayerRoundResults';
import MultiplayerGameComplete from './MultiplayerGameComplete';
import DisconnectedPlayerModal from './DisconnectedPlayerModal';

interface GameProps {
  /** Callback to navigate back to main menu */
  onBackToMainMenu?: () => void;
  /** Callback to navigate to room lobby */
  onBackToLobby?: () => void;
}

/**
 * Internal GameContent component that uses the game context.
 * This is separated from Game to allow the provider to wrap it.
 */
function GameContent({ onBackToMainMenu, onBackToLobby }: GameProps) {
  const { state, dispatch } = useGame();
  const { state: socketState } = useSocket();
  const socket = socketState.socket;

  const [currentGuess, setCurrentGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [mapKey, setMapKey] = useState(0); // Key to force map remount
  // For multiplayer, skip level announcement. For single-player, show it.
  const [showLevelAnnouncement, setShowLevelAnnouncement] = useState(state.gameMode === 'single-player');
  const [showAnimatedPrompt, setShowAnimatedPrompt] = useState(state.gameMode === 'multiplayer');

  // Disconnection modal state
  const [showDisconnectedModal, setShowDisconnectedModal] = useState(false);
  const [disconnectedPlayerName, setDisconnectedPlayerName] = useState('');

  // Rematch countdown state
  const [rematchCountdown, setRematchCountdown] = useState<number | null>(null);

  /**
   * Handle pin placement on the map.
   * Stores the guess coordinates in local state to enable the confirm button.
   */
  const handlePinPlaced = (position: { lat: number; lng: number }) => {
    setCurrentGuess(position);
  };

  /**
   * Handle guess confirmation.
   * For single-player: Calculates distance and score locally.
   * For multiplayer: Emits guess to server for validation.
   */
  const handleConfirmGuess = () => {
    if (!currentGuess) return;

    if (state.gameMode === 'multiplayer') {
      // Multiplayer: Emit to server instead of calculating locally
      socket?.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
        roomCode: state.currentRoom?.code,
        roundNumber: state.multiplayerGameState?.currentRound,
        guess: currentGuess,
        timestamp: Date.now(),
      });

      // Update local state to show waiting indicator
      dispatch({
        type: 'MULTIPLAYER_GUESS_SUBMITTED',
        payload: { guess: currentGuess },
      });

      // Clear current guess
      setCurrentGuess(null);
    } else {
      // Single-player: Calculate locally (existing logic)
      const currentCity = state.selectedCities[state.currentRound - 1];
      if (!currentCity) return;

      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        currentGuess.lat,
        currentGuess.lng,
        currentCity.latitude,
        currentCity.longitude
      );

      // Calculate score based on distance, city difficulty, and level
      const score = calculateScore(distance, currentCity.tier, state.currentLevel);

      // Dispatch SUBMIT_GUESS action to update game state
      dispatch({
        type: 'SUBMIT_GUESS',
        payload: {
          guess: currentGuess,
          distance,
          score,
        },
      });

      // Clear current guess
      setCurrentGuess(null);
    }
  };

  /**
   * Handle continuing to next round after viewing results.
   */
  const handleContinue = () => {
    // Dispatch NEXT_ROUND action
    dispatch({ type: 'NEXT_ROUND' });

    // Reset map by forcing remount
    setMapKey(prev => prev + 1);
    setCurrentGuess(null);
    setShowLevelAnnouncement(true); // Show level announcement
    setShowAnimatedPrompt(false); // City animation comes after
  };

  /**
   * Handle advancing to next level after passing current level.
   */
  const handleAdvanceLevel = () => {
    const nextLevel = state.currentLevel + 1;
    const cities = selectCitiesForLevel(nextLevel);

    dispatch({
      type: 'ADVANCE_LEVEL',
      payload: { cities },
    });

    // Reset map
    setMapKey(prev => prev + 1);
    setCurrentGuess(null);
  };

  /**
   * Handle retrying current level after failure.
   */
  const handleRetryLevel = () => {
    const cities = selectCitiesForLevel(state.currentLevel);

    dispatch({
      type: 'RETRY_LEVEL',
      payload: { cities },
    });

    // Reset map
    setMapKey(prev => prev + 1);
    setCurrentGuess(null);
  };

  /**
   * Handle restarting game from level 1.
   */
  const handleRestartGame = () => {
    const cities = selectCitiesForLevel(1);

    dispatch({
      type: 'RESTART_GAME',
      payload: { cities },
    });

    // Reset map
    setMapKey(prev => prev + 1);
    setCurrentGuess(null);
  };

  /**
   * Handle starting the game from READY state.
   */
  const handleStartGame = () => {
    const cities = selectCitiesForLevel(1);

    dispatch({
      type: 'START_GAME',
      payload: { cities },
    });
    setShowLevelAnnouncement(true); // Show level announcement first
    setShowAnimatedPrompt(false); // City animation comes after
  };

  /**
   * Auto-start game for multiplayer mode.
   * In multiplayer, the backend will provide cities via game:started event.
   */
  useEffect(() => {
    if (state.gameMode === 'multiplayer' && state.gameStatus === GameStatus.READY) {
      // Auto-start the game with cities already in state OR select new ones
      if (state.selectedCities.length > 0) {
        // Cities already provided by game:started event
        dispatch({ type: 'START_GAME', payload: { cities: state.selectedCities } });
      } else {
        // Fallback: select cities locally (should not happen in Phase 5)
        const cities = selectCitiesForLevel(1);
        dispatch({ type: 'START_GAME', payload: { cities } });
      }
      // Skip level announcement for multiplayer - go straight to guessing
      setShowLevelAnnouncement(false);
      setShowAnimatedPrompt(true);
    }
  }, [state.gameMode, state.gameStatus, state.selectedCities, dispatch]);

  // ========== MULTIPLAYER SOCKET EVENT LISTENERS ==========

  /**
   * Listen to round:started event
   * Server sends this when all players are ready for a new round
   */
  useSocketEvent<{
    roundNumber: number;
    startTime: number;
    timerDuration: number;
    cityTarget: { name: string; country: string; latitude: number; longitude: number };
  }>('round:started', (data) => {
    if (state.gameMode !== 'multiplayer') return;

    dispatch({
      type: 'MULTIPLAYER_ROUND_START',
      payload: {
        roundNumber: data.roundNumber,
        startTime: data.startTime,
        timerDuration: data.timerDuration,
      },
    });

    // Reset map to clear previous round's pins
    setMapKey(prev => prev + 1);
    setCurrentGuess(null);

    // Show city animation for new round
    setShowLevelAnnouncement(false); // Skip level announcement in multiplayer
    setShowAnimatedPrompt(true); // Show animated city prompt
  });

  /**
   * Listen to player:guessed event
   * Server broadcasts when any player submits their guess
   */
  useSocketEvent<{ playerId: string; playerName: string; hasGuessed: boolean }>(
    'player:guessed',
    (data) => {
      if (state.gameMode !== 'multiplayer') return;

      dispatch({
        type: 'MULTIPLAYER_PLAYER_GUESSED',
        payload: { playerId: data.playerId, playerName: data.playerName, hasGuessed: data.hasGuessed },
      });
    }
  );

  /**
   * Listen to game:roundComplete event
   * Server sends this when all players have submitted guesses
   */
  useSocketEvent<{
    roundNumber: number;
    targetCity: { name: string; country: string; lat: number; lng: number };
    results: Array<{
      playerId: string;
      playerName: string;
      guess: { lat: number; lng: number };
      distance: number;
      score: number;
    }>;
    standings: Array<{ playerId: string; playerName: string; totalScore: number }>;
  }>('game:roundComplete', (data) => {
    if (state.gameMode !== 'multiplayer') return;

    dispatch({
      type: 'MULTIPLAYER_ROUND_COMPLETE',
      payload: {
        roundNumber: data.roundNumber,
        targetCity: data.targetCity,
        results: data.results,
        standings: data.standings,
      },
    });
  });

  /**
   * Listen to countdown:tick event
   * Server sends countdown ticks (5, 4, 3, 2, 1) for auto-advance
   */
  useSocketEvent<{ roundNumber: number; remainingSeconds: number }>(
    'countdown:tick',
    (data) => {
      if (state.gameMode !== 'multiplayer') return;

      dispatch({
        type: 'MULTIPLAYER_COUNTDOWN_TICK',
        payload: { remainingSeconds: data.remainingSeconds },
      });
    }
  );

  /**
   * Listen to game:complete event
   * Server sends this after the final round (round 5)
   */
  useSocketEvent<{
    roomCode: string;
    finalStandings: Array<{
      playerId: string;
      playerName: string;
      totalScore: number;
      averageDistance: number;
      roundScores: number[];
    }>;
    winner: {
      playerId: string;
      playerName: string;
      totalScore: number;
    };
  }>('game:complete', (data) => {
    if (state.gameMode !== 'multiplayer') return;

    dispatch({
      type: 'MULTIPLAYER_GAME_COMPLETE',
      payload: {
        finalStandings: data.finalStandings,
        winner: data.winner,
      },
    });
  });

  /**
   * Listen to player:disconnected event
   * Show toast during active game, modal during final results
   */
  useSocketEvent<{ playerId: string; playerName: string }>('player:disconnected', (data) => {
    if (state.gameMode !== 'multiplayer') return;

    if (
      state.gameStatus === GameStatus.GUESSING ||
      state.gameStatus === GameStatus.ROUND_COMPLETE
    ) {
      // Show toast during active game
      toast.error(`${data.playerName} disconnected`, { icon: '⚠️' });
    } else if (state.gameStatus === GameStatus.GAME_COMPLETE) {
      // Show blocking modal during final results
      setShowDisconnectedModal(true);
      setDisconnectedPlayerName(data.playerName);
    }
  });

  /**
   * Listen to game:playerLeftResults event
   * Player left during final results/rematch screen
   */
  useSocketEvent<{ playerId: string; playerName: string }>('game:playerLeftResults', (data) => {
    if (state.gameMode !== 'multiplayer') return;

    if (state.gameStatus === GameStatus.GAME_COMPLETE) {
      setShowDisconnectedModal(true);
      setDisconnectedPlayerName(data.playerName);
    }
  });

  /**
   * Listen to game:rematch event (deprecated - now using auto-start)
   * This event is no longer emitted but kept for backwards compatibility
   */
  useSocketEvent('game:rematch', () => {
    if (state.gameMode !== 'multiplayer') return;

    console.log('[Game] Rematch event received (deprecated) - resetting state');

    // Clear all local state
    setRematchCountdown(null);
    setCurrentGuess(null);
    setShowLevelAnnouncement(false);
    setShowAnimatedPrompt(true);
    setShowDisconnectedModal(false);
    setDisconnectedPlayerName('');

    // Force map reset by incrementing key
    setMapKey((prev) => prev + 1);

    // Reset game state
    dispatch({ type: 'MULTIPLAYER_REMATCH' });

    // Do NOT navigate to lobby - game will auto-start
  });

  /**
   * Listen to game:started event
   * Handle auto-start after rematch countdown
   */
  useSocketEvent<{
    roomCode: string;
    difficulty: string;
    timerDuration: number;
    cities: any[];
    roundNumber: number;
    totalRounds: number;
  }>('game:started', (data) => {
    if (state.gameMode !== 'multiplayer') return;

    console.log('[Game] Game auto-started after rematch countdown');

    // Clear countdown state
    setRematchCountdown(null);
    setCurrentGuess(null);
    setShowAnimatedPrompt(true);

    // Force map reset
    setMapKey((prev) => prev + 1);

    // Initialize new game state
    dispatch({
      type: 'MULTIPLAYER_GAME_STARTED',
      payload: {
        cities: data.cities,
        difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
        timerDuration: data.timerDuration,
        totalRounds: data.totalRounds,
      },
    });
  });

  /**
   * Listen to rematch:statusUpdated event
   * Update rematch request status for players
   */
  useSocketEvent<{ playersReady: string[]; totalPlayers: number }>(
    'rematch:statusUpdated',
    (data) => {
      if (state.gameMode !== 'multiplayer') return;

      console.log('[Game] Rematch status updated:', data.playersReady);

      dispatch({
        type: 'MULTIPLAYER_REMATCH_STATUS_UPDATED',
        payload: { rematchRequests: data.playersReady },
      });
    }
  );

  /**
   * Listen to rematch:countdownStarted event
   * Start the countdown display
   */
  useSocketEvent<{ countdown: number }>('rematch:countdownStarted', (data) => {
    if (state.gameMode !== 'multiplayer') return;
    console.log('[Game] Rematch countdown started:', data.countdown);
    setRematchCountdown(data.countdown);
  });

  /**
   * Listen to rematch:countdownTick event
   * Update the countdown display
   */
  useSocketEvent<{ countdown: number }>('rematch:countdownTick', (data) => {
    if (state.gameMode !== 'multiplayer') return;
    console.log('[Game] Rematch countdown tick:', data.countdown);
    setRematchCountdown(data.countdown);
  });

  /**
   * Auto-submit guess when timer expires in multiplayer
   */
  const handleTimerExpired = () => {
    if (state.gameMode !== 'multiplayer' || !socket) return;

    // Auto-submit guess at (0, 0) coordinates
    socket.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
      roomCode: state.currentRoom?.code,
      roundNumber: state.multiplayerGameState?.currentRound,
      guess: { lat: 0, lng: 0 },
      timestamp: Date.now(),
      autoSubmit: true,
    });

    // Update local state
    dispatch({
      type: 'MULTIPLAYER_GUESS_SUBMITTED',
      payload: { guess: { lat: 0, lng: 0 } },
    });

    toast.info("Time's up! Auto-submitting...", { icon: '⏱️' });
  };

  // Get current city for display
  const currentCity = state.selectedCities[state.currentRound - 1];

  // Check if level was passed on LEVEL_COMPLETE
  const levelPassed =
    state.gameStatus === GameStatus.LEVEL_COMPLETE &&
    state.totalScore >= getLevelThreshold(state.currentLevel);

  // Determine if we should show LEVEL_FAILED state
  const levelFailed =
    state.gameStatus === GameStatus.LEVEL_COMPLETE &&
    state.totalScore < getLevelThreshold(state.currentLevel);

  // Update gameStatus to LEVEL_FAILED if needed (this would normally be in reducer)
  useEffect(() => {
    if (levelFailed && state.gameStatus === GameStatus.LEVEL_COMPLETE) {
      // The reducer doesn't set LEVEL_FAILED, so we handle pass/fail in the UI
      // This is intentional - LEVEL_COMPLETE handles both cases
    }
  }, [levelFailed, state.gameStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
      {/* READY State: Initial start screen */}
      {state.gameStatus === GameStatus.READY && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 p-8">
            <h1 className="text-5xl font-bold text-primary">GeoQuest</h1>
            <p className="text-xl text-gray-400">Test your geography knowledge!</p>
            <button
              onClick={handleStartGame}
              className="px-8 py-4 bg-primary text-dark-base rounded-lg font-semibold text-lg hover:bg-accent transition-colors"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* GUESSING and ROUND_COMPLETE States: Share the same map instance */}
      {(state.gameStatus === GameStatus.GUESSING || state.gameStatus === GameStatus.ROUND_COMPLETE) && (
        <>
          {/* Interactive Map - persists across both states to prevent reset */}
          <div className="flex-1 relative min-h-0">
            <InteractiveMap
              key={mapKey}
              onPinPlaced={handlePinPlaced}
              className="absolute inset-0 z-0"
              guessLocation={
                // Single-player: show user's guess during results
                state.gameMode === 'single-player' && state.gameStatus === GameStatus.ROUND_COMPLETE
                  ? state.userGuesses[state.userGuesses.length - 1]
                  // Multiplayer: don't pass guessLocation, let InteractiveMap handle it internally
                  : undefined
              }
              targetLocation={
                state.gameStatus === GameStatus.ROUND_COMPLETE && currentCity
                  ? { lat: currentCity.latitude, lng: currentCity.longitude }
                  : undefined
              }
              showLine={state.gameStatus === GameStatus.ROUND_COMPLETE}
              distance={
                state.gameMode === 'single-player' &&
                state.gameStatus === GameStatus.ROUND_COMPLETE &&
                state.currentDistance !== null
                  ? state.currentDistance
                  : undefined
              }
              playerGuesses={
                state.gameMode === 'multiplayer' &&
                state.gameStatus === GameStatus.ROUND_COMPLETE &&
                state.multiplayerGameState?.roundResults
                  ? state.multiplayerGameState.roundResults.map((result, index) => ({
                      playerId: result.playerId,
                      playerName: result.playerName,
                      guess: result.guess,
                      color: ['#3b82f6', '#10b981', '#a855f7', '#f97316'][index % 4],
                      distance: result.distance,
                    }))
                  : undefined
              }
              cityName={
                state.gameStatus === GameStatus.ROUND_COMPLETE && currentCity
                  ? currentCity.name
                  : undefined
              }
            />

            {/* Game Info Card - Only show in single-player mode */}
            {state.gameMode === 'single-player' && (
              <div className="absolute top-4 left-4 z-20">
                <GameInfoCard
                  level={state.currentLevel}
                  round={state.currentRound}
                  currentScore={state.roundScores[state.roundScores.length - 1] || 0}
                  totalScore={state.totalScore}
                  requiredScore={getLevelThreshold(state.currentLevel)}
                />
              </div>
            )}

            {/* Confirm Button (appears when pin is placed during GUESSING) */}
            {state.gameStatus === GameStatus.GUESSING && currentGuess && !state.multiplayerGameState?.hasGuessed && (
              <div className="relative z-10">
                <ConfirmButton onConfirm={handleConfirmGuess} disabled={false} />
              </div>
            )}

            {/* Multiplayer Timer (shown during GUESSING state, continues after player submits) */}
            {state.gameMode === 'multiplayer' &&
              state.gameStatus === GameStatus.GUESSING &&
              state.multiplayerGameState?.roundStartTime &&
              state.multiplayerGameState?.timerDuration && (
                <MultiplayerTimer
                  serverStartTime={state.multiplayerGameState.roundStartTime}
                  timerDuration={state.multiplayerGameState.timerDuration}
                  onTimeUp={handleTimerExpired}
                />
              )}

            {/* Waiting Indicator (after player submits but opponent hasn't) */}
            {state.gameMode === 'multiplayer' &&
              state.gameStatus === GameStatus.GUESSING &&
              state.multiplayerGameState?.hasGuessed && (
                <WaitingIndicator
                  opponentName={
                    state.currentRoom?.players.find((p) => p.id !== state.currentPlayer?.id)?.name || 'opponent'
                  }
                />
              )}

            {/* Level Announcement (shows first during GUESSING) */}
            {state.gameStatus === GameStatus.GUESSING && showLevelAnnouncement && (
              <LevelAnnouncement
                level={state.currentLevel}
                round={state.currentRound}
                onComplete={() => {
                  setShowLevelAnnouncement(false);
                  setShowAnimatedPrompt(true);
                }}
              />
            )}

            {/* City Prompt - Shows with animation when round starts, then stays at top-right on desktop, below GameInfoCard on mobile (GUESSING only) */}
            {state.gameStatus === GameStatus.GUESSING && currentCity && !showLevelAnnouncement && (
              showAnimatedPrompt ? (
                <CityPrompt
                  cityName={currentCity.name}
                  country={currentCity.country}
                  showInitialAnimation
                  onAnimationComplete={() => setShowAnimatedPrompt(false)}
                />
              ) : (
                <div className="absolute top-20 left-4 sm:top-4 sm:left-auto sm:right-4 z-20">
                  <CityPrompt cityName={currentCity.name} country={currentCity.country} />
                </div>
              )
            )}

            {/* Results overlay - Single-player (ROUND_COMPLETE only) */}
            {state.gameMode === 'single-player' &&
              state.gameStatus === GameStatus.ROUND_COMPLETE &&
              currentCity &&
              state.currentDistance !== null && (
                <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
                  <div className="pointer-events-auto">
                    <RoundResults
                      distance={state.currentDistance}
                      score={state.roundScores[state.roundScores.length - 1] || 0}
                      cityName={currentCity.name}
                      onContinue={handleContinue}
                    />
                  </div>
                </div>
              )}

            {/* Multiplayer Round Results (ROUND_COMPLETE only) */}
            {state.gameMode === 'multiplayer' &&
              state.gameStatus === GameStatus.ROUND_COMPLETE &&
              state.multiplayerGameState?.roundResults &&
              currentCity && (
                <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
                  <div className="pointer-events-auto">
                    <MultiplayerRoundResults
                      roundNumber={state.multiplayerGameState.currentRound}
                      totalRounds={state.multiplayerGameState.totalRounds}
                      results={state.multiplayerGameState.roundResults}
                      currentPlayerId={state.currentPlayer?.id || ''}
                      targetCityName={currentCity.name}
                      countdown={state.multiplayerGameState.autoAdvanceCountdown}
                      roundScore={state.multiplayerGameState.roundResults.find(r => r.playerId === state.currentPlayer?.id)?.score || 0}
                      totalScore={state.multiplayerGameState.standings.find(s => s.playerId === state.currentPlayer?.id)?.totalScore || 0}
                    />
                  </div>
                </div>
              )}
          </div>
        </>
      )}

      {/* LEVEL_COMPLETE State: Show level summary (single-player only) */}
      {state.gameMode === 'single-player' && state.gameStatus === GameStatus.LEVEL_COMPLETE && (
        <div className="flex-1 flex items-center justify-center p-4">
          <LevelComplete
            totalScore={state.totalScore}
            threshold={getLevelThreshold(state.currentLevel)}
            passed={levelPassed}
            onNextLevel={handleAdvanceLevel}
            onRetryLevel={handleRetryLevel}
            onRestartGame={handleRestartGame}
          />
        </div>
      )}

      {/* GAME_COMPLETE State: Multiplayer final results */}
      {state.gameMode === 'multiplayer' &&
        state.gameStatus === GameStatus.GAME_COMPLETE &&
        state.multiplayerGameState?.winner && (
          <div className="flex-1 flex items-center justify-center p-4">
            <MultiplayerGameComplete
              finalStandings={state.multiplayerGameState?.finalStats || []}
              winner={state.multiplayerGameState.winner}
              currentPlayerId={state.currentPlayer?.id || ''}
              allPlayers={
                state.currentRoom?.players.map((p) => ({ id: p.id, name: p.name })) || []
              }
              rematchRequests={state.multiplayerGameState?.rematchRequests || new Set()}
              hasRequestedRematch={state.multiplayerGameState?.rematchRequests?.has(
                state.currentPlayer?.id || ''
              )}
              rematchCountdown={rematchCountdown}
              onPlayAgain={() => {
                socket?.emit('game:rematchRequest', {
                  roomCode: state.currentRoom?.code,
                });
                dispatch({
                  type: 'MULTIPLAYER_REMATCH_REQUESTED',
                  payload: { playerId: state.currentPlayer?.id || '' },
                });
              }}
              onLeaveRoom={() => {
                socket?.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomCode: state.currentRoom?.code });
                if (onBackToMainMenu) {
                  onBackToMainMenu();
                }
              }}
            />
          </div>
        )}

      {/* Disconnected Player Modal (blocking) */}
      {showDisconnectedModal && (
        <DisconnectedPlayerModal
          playerName={disconnectedPlayerName}
          onMainMenu={() => {
            setShowDisconnectedModal(false);
            if (onBackToMainMenu) {
              onBackToMainMenu();
            }
          }}
        />
      )}
      </div>
    </div>
  );
}

/**
 * Main Game component that wraps the game content with the GameProvider.
 * This component orchestrates the complete game flow including:
 * - Single-player: Game initialization and city selection, round-by-round gameplay with map interaction,
 *   score calculation and result display, level progression and failure handling
 * - Multiplayer: Synchronized real-time gameplay, timer-based rounds, multi-player results,
 *   final standings with rematch functionality
 *
 * The game integrates all UI components and manages state transitions
 * through the GameContext using the useReducer pattern.
 */
export default function Game({ onBackToMainMenu, onBackToLobby }: GameProps = {}) {
  return <GameContent onBackToMainMenu={onBackToMainMenu} onBackToLobby={onBackToLobby} />;
}
