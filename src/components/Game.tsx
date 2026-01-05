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
      if (state.selectedCities.length === 0) {
        const cities = selectCitiesForLevel(1);
        dispatch({
          type: 'START_GAME',
          payload: { cities },
        });
      }
    }
  }, [state.gameMode, state.gameStatus, state.selectedCities.length, dispatch]);

  /**
   * Listen to game:started event
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

    console.log('[Game] Game started event received', data);

    dispatch({
      type: 'MULTIPLAYER_GAME_STARTED',
      payload: {
        cities: data.cities,
        difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
        timerDuration: data.timerDuration,
        totalRounds: data.totalRounds,
      },
    });

    // Show animated city prompt for multiplayer
    setShowAnimatedPrompt(true);
  });

  /**
   * Listen to round:start event
   */
  useSocketEvent<{
    roundNumber: number;
    startTime: number;
    timerDuration: number;
  }>('round:start', (data) => {
    if (state.gameMode !== 'multiplayer') return;

    console.log('[Game] Round started', data);

    dispatch({
      type: 'MULTIPLAYER_ROUND_START',
      payload: {
        roundNumber: data.roundNumber,
        startTime: data.startTime,
        timerDuration: data.timerDuration,
      },
    });

    // Show animated city prompt for new round
    setShowAnimatedPrompt(true);
  });

  /**
   * Listen to game:player_guessed event
   */
  useSocketEvent<{
    playerId: string;
    playerName: string;
    hasGuessed: boolean;
  }>('game:player_guessed', (data) => {
    if (state.gameMode !== 'multiplayer') return;

    console.log('[Game] Player guessed', data);

    dispatch({
      type: 'MULTIPLAYER_PLAYER_GUESSED',
      payload: {
        playerId: data.playerId,
        playerName: data.playerName,
        hasGuessed: data.hasGuessed,
      },
    });
  });

  /**
   * Listen to game:round_complete event
   */
  useSocketEvent<{
    roundNumber: number;
    targetCity: {
      name: string;
      country: string;
      lat: number;
      lng: number;
    };
    results: any[];
    standings: any[];
  }>('game:round_complete', (data) => {
    if (state.gameMode !== 'multiplayer') return;

    console.log('[Game] Round complete', data);

    dispatch({
      type: 'MULTIPLAYER_ROUND_COMPLETE',
      payload: {
        roundNumber: data.roundNumber,
        targetCity: data.targetCity,
        results: data.results,
        standings: data.standings,
      },
    });

    // Clear current guess
    setCurrentGuess(null);
  });

  /**
   * Listen to game:countdown_tick event for auto-advance countdown
   */
  useSocketEvent<{ remainingSeconds: number }>('game:countdown_tick', (data) => {
    if (state.gameMode !== 'multiplayer') return;

    dispatch({
      type: 'MULTIPLAYER_COUNTDOWN_TICK',
      payload: {
        remainingSeconds: data.remainingSeconds,
      },
    });
  });

  /**
   * Listen to game:complete event
   */
  useSocketEvent<{
    finalStandings: any[];
    winner: any;
  }>('game:complete', (data) => {
    if (state.gameMode !== 'multiplayer') return;

    console.log('[Game] Game complete', data);

    dispatch({
      type: 'MULTIPLAYER_GAME_COMPLETE',
      payload: {
        finalStandings: data.finalStandings,
        winner: data.winner,
      },
    });

    // Clear local state
    setCurrentGuess(null);
    setShowAnimatedPrompt(false);
  });

  /**
   * Listen to player:disconnected event
   */
  useSocketEvent<{ playerId: string; playerName: string }>('player:disconnected', (data) => {
    if (state.gameMode !== 'multiplayer') return;

    console.log('[Game] Player disconnected', data);

    setDisconnectedPlayerName(data.playerName);
    setShowDisconnectedModal(true);

    toast.warning(`${data.playerName} has disconnected`);
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
   * Handle multiplayer timer expiration
   */
  const handleMultiplayerTimeUp = () => {
    console.log('[Game] Multiplayer timer expired');
    // Timer expiration is handled by the server
    // Server will emit game:round_complete when time is up
  };

  /**
   * Current city for the active round
   */
  const currentCity = state.selectedCities[
    state.gameMode === 'multiplayer'
      ? (state.multiplayerGameState?.currentRound || 1) - 1
      : state.currentRound - 1
  ];

  // Determine if we should show LEVEL_FAILED state
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
                  ? state.multiplayerGameState.roundResults
                      .filter(result => result.guess !== null) // Filter out null guesses
                      .map((result, index) => ({
                        playerId: result.playerId,
                        playerName: result.playerName,
                        guess: result.guess as { lat: number; lng: number },
                        color: ['#3b82f6', '#10b981', '#a855f7', '#f97316', '#eab308'][index % 5],
                        distance: result.distance || undefined,
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
                  score={state.totalScore}
                />
              </div>
            )}

            {/* Multiplayer Timer - Only show during GUESSING state */}
            {state.gameMode === 'multiplayer' &&
              state.gameStatus === GameStatus.GUESSING &&
              state.multiplayerGameState?.roundStartTime && (
                <MultiplayerTimer
                  serverStartTime={state.multiplayerGameState.roundStartTime}
                  timerDuration={state.multiplayerGameState.timerDuration}
                  onTimeUp={handleMultiplayerTimeUp}
                />
              )}

            {/* Multiplayer Waiting Indicator - Show after player submits guess */}
            {state.gameMode === 'multiplayer' &&
              state.gameStatus === GameStatus.GUESSING &&
              state.multiplayerGameState?.hasGuessed && (
                <WaitingIndicator
                  message="Waiting for other players..."
                  totalPlayers={state.currentRoom?.players.length || 0}
                  playersGuessed={
                    1 +
                    Array.from(state.multiplayerGameState.otherPlayersGuessed.values()).filter((g) => g)
                      .length
                  }
                />
              )}

            {/* City Prompt - Show city name and country */}
            {currentCity && state.gameStatus === GameStatus.GUESSING && (
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

            {/* Confirm Button - Only show during GUESSING state when pin is placed */}
            {state.gameStatus === GameStatus.GUESSING && currentGuess && (
              <ConfirmButton
                onConfirm={handleConfirmGuess}
                disabled={!currentGuess}
              />
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
              onRematch={() => {
                socket?.emit('rematch:request', {
                  roomCode: state.currentRoom?.code,
                });
              }}
              onLeaveRoom={() => {
                if (onBackToLobby) {
                  onBackToLobby();
                }
              }}
              rematchCountdown={rematchCountdown}
            />
          </div>
        )}

      {/* Level Announcement Overlay (single-player only) */}
      {state.gameMode === 'single-player' && showLevelAnnouncement && (
        <LevelAnnouncement
          level={state.currentLevel}
          onComplete={() => {
            setShowLevelAnnouncement(false);
            setShowAnimatedPrompt(true);
          }}
        />
      )}

      {/* Disconnected Player Modal */}
      <DisconnectedPlayerModal
        isOpen={showDisconnectedModal}
        playerName={disconnectedPlayerName}
        onClose={() => setShowDisconnectedModal(false)}
        onLeaveRoom={onBackToLobby}
      />
      </div>
    </div>
  );
}

export default function Game(props: GameProps) {
  return <GameContent {...props} />;
}
