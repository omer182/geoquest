import { useSocket } from '../hooks/useSocket';

/**
 * Connection status indicator component that displays the current WebSocket connection state.
 *
 * Features:
 * - Color-coded status indicator (green/yellow/red)
 * - Latency display when connected
 * - Reconnection attempt counter
 * - Manual retry button on error
 * - Pulsing animation for connecting states
 * - Fixed position in top-right corner
 *
 * The indicator shows:
 * - Green dot: Connected
 * - Yellow pulsing dot: Connecting or Reconnecting
 * - Red dot: Disconnected or Error
 *
 * @returns Connection status indicator component
 */
export function ConnectionStatus(): JSX.Element {
  const { state, reconnect } = useSocket();

  /**
   * Get status color class based on connection status.
   */
  const getStatusColor = (): string => {
    switch (state.connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  /**
   * Get status text for tooltip.
   */
  const getStatusText = (): string => {
    switch (state.connectionStatus) {
      case 'connected':
        return state.latency !== null ? `Connected (${state.latency}ms)` : 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting (${state.reconnectAttempts}/5)...`;
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return state.error || 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  /**
   * Determines if retry button should be shown.
   */
  const showRetryButton = state.connectionStatus === 'error';

  return (
    <div
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white rounded-lg shadow-md px-3 py-2 border border-gray-200"
      role="status"
      aria-live="polite"
      title={getStatusText()}
    >
      {/* Status indicator dot */}
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor()}`}
          aria-label={`Connection status: ${state.connectionStatus}`}
        />

        {/* Status text and latency */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-700 font-medium capitalize">
            {state.connectionStatus}
          </span>

          {/* Latency display when connected */}
          {state.connectionStatus === 'connected' && state.latency !== null && (
            <span className="text-gray-500 text-xs">({state.latency}ms)</span>
          )}

          {/* Reconnection attempt counter */}
          {state.connectionStatus === 'reconnecting' && (
            <span className="text-gray-500 text-xs">
              ({state.reconnectAttempts}/5)
            </span>
          )}
        </div>
      </div>

      {/* Retry button for error state */}
      {showRetryButton && (
        <button
          onClick={reconnect}
          className="ml-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          aria-label="Retry connection"
        >
          Retry
        </button>
      )}
    </div>
  );
}
