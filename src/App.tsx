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
import AtlasScreen, { AtlasHeading } from './components/ui/AtlasScreen';

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
      return <Game onBackToMainMenu={handleBackToMainMenu} onBackToLobby={() => setCurrentScreen('multiplayer-submenu')} />;

    case 'about':
      return (
        <AtlasScreen>
          <AtlasHeading eyebrow="The expedition log" title="About GeoQuest" />
          <div className="atlas-card space-y-4 p-6 text-center">
            <p className="text-sm leading-relaxed text-ink-soft sm:text-base">
              GeoQuest is a geography quiz game where you test your knowledge of world cities by
              guessing their locations on a map.
            </p>
            <p className="text-sm leading-relaxed text-ink-soft sm:text-base">
              Built with React, TypeScript, Leaflet, and Socket.IO for real-time multiplayer
              gameplay.
            </p>
            <p className="border-t border-paper-line pt-4 font-display text-xs italic text-ink-faint">
              This entire project was built using spec-driven development with agent-os. Not a
              single line of code was written or even looked at by a human - fully vibe coding.
            </p>
            <button onClick={handleBackToMainMenu} className="btn btn-secondary btn-block">
              Main Menu
            </button>
          </div>
        </AtlasScreen>
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
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#FBF6EA', color: '#1E2A44', border: '1px solid #E0D2B4', fontFamily: 'Inter, sans-serif' },
          }}
        />
        <AppContent />
      </GameProvider>
    </WebSocketProvider>
  );
}

export default App;
