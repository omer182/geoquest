import { City } from './city';
import { Room, Player } from './socket-events';

/**
 * Represents the current status of the game flow.
 * Used to determine which UI components to display and what actions are available.
 */
export enum GameStatus {
  /** Initial state before game starts */
  READY = 'READY',
  /** Player is actively placing a pin to guess a city location */
  GUESSING = 'GUESSING',
  /** Round has been completed, showing results and distance/score */
  ROUND_COMPLETE = 'ROUND_COMPLETE',
  /** All 5 rounds completed, showing level summary */
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  /** Player failed to meet the level threshold */
  LEVEL_FAILED = 'LEVEL_FAILED',
  /** Multiplayer game completed */
  GAME_COMPLETE = 'GAME_COMPLETE',
}

/**
 * Game mode type
 */
export type GameMode = 'single-player' | 'multiplayer';

/**
 * Difficulty levels for the game
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/**
 * Represents a user's guess coordinates for a city location.
 */
export interface Guess {
  /** Latitude of the guessed location */
  lat: number;
  /** Longitude of the guessed location */
  lng: number;
}

/**
 * Player round result data for multiplayer
 */
export interface PlayerRoundResult {
  playerId: string;
  playerName: string;
  guess: Guess;
  distance: number;
  score: number;
}

/**
 * Player standing data for multiplayer
 */
export interface PlayerStanding {
  playerId: string;
  playerName: string;
  totalScore: number;
}

/**
 * Final player statistics for multiplayer game complete
 */
export interface PlayerFinalStats extends PlayerStanding {
  averageDistance: number;
  roundScores: number[];
}

/**
 * Multiplayer game state
 */
export interface MultiplayerGameState {
  /** Current round number (1-5) */
  currentRound: number;
  /** Total rounds in game */
  totalRounds: number;
  /** Timer duration in seconds (15, 30, 45, or 60) */
  timerDuration: number;
  /** Server timestamp when round started */
  roundStartTime: number | null;
  /** Current player's guess for this round */
  currentGuess: Guess | null;
  /** Whether current player has submitted guess */
  hasGuessed: boolean;
  /** Map of other players who have guessed */
  otherPlayersGuessed: Map<string, boolean>;
  /** Round results after all players submit */
  roundResults: PlayerRoundResult[] | null;
  /** Current standings */
  standings: PlayerStanding[];
  /** Whether waiting for next round to start */
  isWaitingForNextRound: boolean;
  /** Auto-advance countdown value (5, 4, 3, 2, 1) */
  autoAdvanceCountdown: number | null;
  /** Set of player IDs who want rematch */
  rematchRequests: Set<string>;
  /** Final game statistics */
  finalStats: PlayerFinalStats[] | null;
  /** Winner information */
  winner: PlayerStanding | null;
}

/**
 * Represents the complete game state for both single-player and multiplayer modes.
 * All state is managed in memory and resets on page refresh.
 */
export interface GameState {
  /** Current level number (1-indexed, infinite progression) */
  currentLevel: number;

  /** Current round within the level (1-5) */
  currentRound: number;

  /** Array of 5 cities selected for the current level */
  selectedCities: City[];

  /** Array of user guesses for completed rounds (length matches completed rounds) */
  userGuesses: Guess[];

  /** Array of scores earned for each completed round (length matches completed rounds) */
  roundScores: number[];

  /** Total accumulated score for the current level */
  totalScore: number;

  /** Current status of the game flow */
  gameStatus: GameStatus;

  /** Highest level reached during the current session */
  highestLevel: number;

  /** Distance in km for the current/last round (used for displaying results) */
  currentDistance: number | null;

  /** Actual city location for the current round (used after guess is submitted) */
  currentCityLocation: { lat: number; lng: number } | null;

  /** Current game mode */
  gameMode: GameMode;

  /** Current multiplayer room (null in single-player mode) */
  currentRoom: Room | null;

  /** Current player data (null in single-player mode) */
  currentPlayer: Player | null;

  /** Selected difficulty level (for multiplayer, set by host) */
  difficulty: DifficultyLevel;

  /** Multiplayer-specific game state (null in single-player mode) */
  multiplayerGameState: MultiplayerGameState | null;
}

/**
 * Action to start a new game from level 1.
 */
export interface StartGameAction {
  type: 'START_GAME';
  payload: {
    cities: City[];
  };
}

/**
 * Action to submit a user's guess for the current round.
 */
export interface SubmitGuessAction {
  type: 'SUBMIT_GUESS';
  payload: {
    guess: Guess;
    distance: number;
    score: number;
  };
}

/**
 * Action to advance to the next round within the current level.
 */
export interface NextRoundAction {
  type: 'NEXT_ROUND';
}

/**
 * Action to advance to the next level after successfully completing current level.
 */
export interface AdvanceLevelAction {
  type: 'ADVANCE_LEVEL';
  payload: {
    cities: City[];
  };
}

/**
 * Action to retry the current level after failing to meet threshold.
 */
export interface RetryLevelAction {
  type: 'RETRY_LEVEL';
  payload: {
    cities: City[];
  };
}

/**
 * Action to restart the game from level 1.
 */
export interface RestartGameAction {
  type: 'RESTART_GAME';
  payload: {
    cities: City[];
  };
}

/**
 * Action to set the game mode (single-player or multiplayer).
 */
export interface SetGameModeAction {
  type: 'SET_GAME_MODE';
  payload: {
    mode: GameMode;
  };
}

/**
 * Action to join a multiplayer room.
 */
export interface JoinRoomAction {
  type: 'JOIN_ROOM';
  payload: {
    room: Room;
    player: Player;
  };
}

/**
 * Action to update the current room state.
 */
export interface UpdateRoomAction {
  type: 'UPDATE_ROOM';
  payload: {
    room: Room;
  };
}

/**
 * Action to leave the current room.
 */
export interface LeaveRoomAction {
  type: 'LEAVE_ROOM';
}

/**
 * Action to set difficulty level.
 */
export interface SetDifficultyAction {
  type: 'SET_DIFFICULTY';
  payload: {
    difficulty: DifficultyLevel;
  };
}

/**
 * Action when multiplayer game starts.
 */
export interface MultiplayerGameStartedAction {
  type: 'MULTIPLAYER_GAME_STARTED';
  payload: {
    cities: City[];
    difficulty: DifficultyLevel;
    timerDuration: number;
    totalRounds: number;
  };
}

/**
 * Action when multiplayer round starts.
 */
export interface MultiplayerRoundStartAction {
  type: 'MULTIPLAYER_ROUND_START';
  payload: {
    roundNumber: number;
    startTime: number;
    timerDuration: number;
  };
}

/**
 * Action when player submits guess in multiplayer.
 */
export interface MultiplayerGuessSubmittedAction {
  type: 'MULTIPLAYER_GUESS_SUBMITTED';
  payload: {
    guess: Guess;
  };
}

/**
 * Action when another player submits guess.
 */
export interface MultiplayerPlayerGuessedAction {
  type: 'MULTIPLAYER_PLAYER_GUESSED';
  payload: {
    playerId: string;
    playerName: string;
    hasGuessed: boolean;
  };
}

/**
 * Action when round is complete in multiplayer.
 */
export interface MultiplayerRoundCompleteAction {
  type: 'MULTIPLAYER_ROUND_COMPLETE';
  payload: {
    roundNumber: number;
    targetCity: {
      name: string;
      country: string;
      lat: number;
      lng: number;
    };
    results: PlayerRoundResult[];
    standings: PlayerStanding[];
  };
}

/**
 * Action for countdown tick.
 */
export interface MultiplayerCountdownTickAction {
  type: 'MULTIPLAYER_COUNTDOWN_TICK';
  payload: {
    remainingSeconds: number;
  };
}

/**
 * Action when multiplayer game is complete.
 */
export interface MultiplayerGameCompleteAction {
  type: 'MULTIPLAYER_GAME_COMPLETE';
  payload: {
    finalStandings: PlayerFinalStats[];
    winner: PlayerStanding;
  };
}

/**
 * Action when player requests rematch.
 */
export interface MultiplayerRematchRequestedAction {
  type: 'MULTIPLAYER_REMATCH_REQUESTED';
  payload: {
    playerId: string;
  };
}

/**
 * Action when rematch status updates.
 */
export interface MultiplayerRematchStatusUpdatedAction {
  type: 'MULTIPLAYER_REMATCH_STATUS_UPDATED';
  payload: {
    rematchRequests: string[];
  };
}

/**
 * Action when rematch is triggered.
 */
export interface MultiplayerRematchAction {
  type: 'MULTIPLAYER_REMATCH';
}

/**
 * Discriminated union of all possible game actions.
 * TypeScript will enforce correct payload types for each action.
 */
export type GameAction =
  | StartGameAction
  | SubmitGuessAction
  | NextRoundAction
  | AdvanceLevelAction
  | RetryLevelAction
  | RestartGameAction
  | SetGameModeAction
  | JoinRoomAction
  | UpdateRoomAction
  | LeaveRoomAction
  | SetDifficultyAction
  | MultiplayerGameStartedAction
  | MultiplayerRoundStartAction
  | MultiplayerGuessSubmittedAction
  | MultiplayerPlayerGuessedAction
  | MultiplayerRoundCompleteAction
  | MultiplayerCountdownTickAction
  | MultiplayerGameCompleteAction
  | MultiplayerRematchRequestedAction
  | MultiplayerRematchStatusUpdatedAction
  | MultiplayerRematchAction;
