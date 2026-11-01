export interface AgentWsEvent {
  event: 'STEP_UPDATE' | 'AGENT_HITL_REQUIRED' | 'AGENT_COMPLETED' | 'AGENT_FAILED' | string;
  run_id?: string;
  step_number?: number;
  action?: string;
  detail?: string;
  screenshot_url?: string;
  status?: string;
  timestamp?: string;
  prompt_message?: string;
  obstacle_screenshot_url?: string;
  obstacle_type?: string;
  tracking_receipt_id?: string;
  receipt_pdf_url?: string;
  error?: string;
}

export type WsEventHandler = (event: AgentWsEvent) => void;

export function connectAgentWebSocket(
  runId: string,
  onEvent: WsEventHandler,
  onError?: (err: Event) => void
): () => void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws/agent/${runId}`;

  let ws: WebSocket | null = null;
  let isClosedManually = false;

  function init() {
    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (messageEvent) => {
        try {
          const payload = JSON.parse(messageEvent.data) as AgentWsEvent;
          onEvent(payload);
        } catch (e) {
          console.warn('Failed to parse agent WS message:', e);
        }
      };

      ws.onerror = (e) => {
        if (!isClosedManually && onError) {
          onError(e);
        }
      };

      ws.onclose = () => {
        if (!isClosedManually) {
          // Reconnect attempt after 2 seconds
          setTimeout(() => {
            if (!isClosedManually) init();
          }, 2000);
        }
      };
    } catch (err) {
      console.warn('WebSocket connection init failed:', err);
    }
  }

  init();

  return () => {
    isClosedManually = true;
    if (ws) {
      ws.close();
      ws = null;
    }
  };
}

