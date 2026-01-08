/**
 * HTTP API Service para POC com backend Python
 * Substitui comunicação VSCode por HTTP + SSE
 */

const API_BASE_URL = '/api'; // Usa proxy do Vite

export interface ProgressPayload {
  chunk: string;
  accumulatedText: string;
  explanatoryText?: string;
  contentType?: 'tool_use' | 'text';
  timestamp: string;
}

export type ProgressCallback = (payload: ProgressPayload) => void;

export interface ChatResult {
  type: 'success' | 'error';
  fullResponse?: string;
  executionTimeMs?: number;
  error?: { code: string; message: string };
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export async function sendChatMessage(
  message: string,
  requestId: string,
  onProgress?: ProgressCallback
): Promise<ChatResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, request_id: requestId }),
    });

    if (!response.ok) {
      return { type: 'error', error: { code: 'NETWORK_ERROR', message: `HTTP ${response.status}` } };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return { type: 'error', error: { code: 'STREAM_ERROR', message: 'No body' } };
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'chunk') {
              accumulated += event.content;
              onProgress?.({
                chunk: event.content,
                accumulatedText: accumulated,
                explanatoryText: accumulated,
                contentType: 'text',
                timestamp: event.timestamp,
              });
            } else if (event.type === 'done') {
              return {
                type: 'success',
                fullResponse: event.full_response,
                executionTimeMs: event.execution_time_ms,
              };
            } else if (event.type === 'error') {
              return { type: 'error', error: { code: event.code, message: event.message } };
            }
          } catch {
            /* ignore parse errors */
          }
        }
      }
    }
    return { type: 'error', error: { code: 'INCOMPLETE', message: 'Stream ended unexpectedly' } };
  } catch (e) {
    return { type: 'error', error: { code: 'REQUEST_FAILED', message: String(e) } };
  }
}
