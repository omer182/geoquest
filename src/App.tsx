import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import Game from './components/Game';
import MainMenu from './components/MainMenu';
import MultiplayerSubmenu from './components/MultiplayerSubmenu';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import RoomLobby from './components/RoomLobby';
import { WebSocketProvider } from './context/WebSocketContext';
import { GameProvider, useGame } from './context/GameContext';
import { ConnectionStatus } from './components/ConnectionStatus';

type AppScreen =
  | 'main-menu'
  | 'multiplayer-submenu'
  | 'create-room'
  | 'join-room'
  | 'room-lobby'
  | 'game'
  | 'about';

/**
 * Internal AppContent component that uses the game context.
 * Handles navigation between different screens.
 */
function AppContent() {
  const { state, dispatch } = useGame();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('main-menu');
  const [urlRoomCode, setUrlRoomCode] = useState<string | null>(null);

  // Check for room code in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode) {
      setUrlRoomCode(roomCode);
      setCurrentScreen('join-room');
    }
  }, []);

  // Navigation handlers
  const handleSinglePlayer = () => {
    dispatch({ type: 'SET_GAME_MODE', payload: { mode: 'single-player' } });
    setCurrentScreen('game');
  };

  const handleMultiplayer = () => {
    setCurrentScreen('multiplayer-submenu');
  };

  const handleAbout = () => {
    setCurrentScreen('about');
  };

  const handleCreateRoom = () => {
    setCurrentScreen('create-room');
  };

  const handleJoinRoom = () => {
    setCurrentScreen('join-room');
  };

  const handleRoomCreated = () => {
    setCurrentScreen('room-lobby');
  };

  const handleRoomJoined = () => {
    setCurrentScreen('room-lobby');
  };

  const handleGameStart = () => {
    setCurrentScreen('game');
  };

  const handleBackToMainMenu = () => {
    dispatch({ type: 'LEAVE_ROOM' });
    setCurrentScreen('main-menu');
  };

  const handleBackToMultiplayerMenu = () => {
    setCurrentScreen('multiplayer-submenu');
  };

  // Render current screen
  switch (currentScreen) {
    case 'main-menu':
      return (
        <MainMenu
          onSinglePlayer={handleSinglePlayer}
          onMultiplayer={handleMultiplayer}
          onAbout={handleAbout}
        />
      );

    case 'multiplayer-submenu':
      return (
        <MultiplayerSubmenu
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onBack={handleBackToMainMenu}
        />
      );

    case 'create-room':
      return (
        <CreateRoom onRoomCreated={handleRoomCreated} onBack={handleBackToMultiplayerMenu} />
      );

    case 'join-room':
      return <JoinRoom onRoomJoined={handleRoomJoined} onBack={handleBackToMultiplayerMenu} />;

    case 'room-lobby':
      return <RoomLobby onGameStart={handleGameStart} onLeave={handleBackToMainMenu} />;

    case 'game':
      return <Game onBackToMainMenu={handleBackToMainMenu} onBackToLobby={() => setCurrentScreen('room-lobby')} />;

    case 'about':
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-4 relative overflow-hidden">
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />

          {/* Animated orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          </div>

          <div className="max-w-2xl space-y-6 relative z-10 animate-fade-in-up">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">About GeoQuest</h1>
            <p className="text-gray-300 text-lg">
              GeoQuest is a geography quiz game where you test your knowledge of world cities by
              guessing their locations on a map.
            </p>
            <p className="text-gray-300">
              Built with React, TypeScript, Leaflet, and Socket.IO for real-time multiplayer
              gameplay.
            </p>
            <button
              onClick={handleBackToMainMenu}
              className="mt-8 w-full py-4 px-6 bg-transparent hover:bg-dark-elevated text-gray-400 hover:text-white font-medium text-base rounded-xl transition-all duration-200 border border-gray-700 hover:border-gray-600"
            >
              Back to Main Menu
            </button>
          </div>
        </div>
      );

    default:
      return <MainMenu onSinglePlayer={handleSinglePlayer} onMultiplayer={handleMultiplayer} onAbout={handleAbout} />;
  }
}

/**
 * Root application component.
 * Provides WebSocket and Game context, handles navigation between screens.
 *
 * The app is wrapped with WebSocketProvider to enable real-time
 * multiplayer functionality. The ConnectionStatus indicator
 * shows the current WebSocket connection state in the top-right corner.
 */
function App() {
  return (
    <WebSocketProvider>
      <GameProvider>
        <Toaster position="top-center" richColors />
        <AppContent />
      </GameProvider>
    </WebSocketProvider>
  );
}

export default App;
