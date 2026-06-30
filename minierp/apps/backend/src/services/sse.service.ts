import { Response } from 'express';

interface SSEClient {
  userId: string;
  res: Response;
  lastHeartbeat: Date;
}

export class SSEService {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000;

  startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, userId) => {
        try {
          client.res.write(`:heartbeat\n\n`);
          client.lastHeartbeat = new Date();
        } catch {
          this.removeClient(userId);
        }
      });
    }, this.HEARTBEAT_INTERVAL);

    console.log('💓 SSE heartbeat started');
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('💔 SSE heartbeat stopped');
    }
  }

  addClient(userId: string, res: Response): void {
    const existing = this.clients.get(userId);
    if (existing) {
      this.removeClient(userId);
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`:connected\n\n`);

    this.clients.set(userId, {
      userId,
      res,
      lastHeartbeat: new Date(),
    });

    console.log(`📡 SSE client connected: ${userId} (total: ${this.clients.size})`);

    res.on('close', () => {
      this.removeClient(userId);
    });
  }

  removeClient(userId: string): void {
    const client = this.clients.get(userId);
    if (client) {
      try {
        client.res.end();
      } catch {
        // Connection already closed
      }
      this.clients.delete(userId);
      console.log(`📡 SSE client disconnected: ${userId} (total: ${this.clients.size})`);
    }
  }

  sendEvent(userId: string, event: string, data: unknown): void {
    const client = this.clients.get(userId);
    if (client) {
      try {
        client.res.write(`event: ${event}\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch {
        this.removeClient(userId);
      }
    }
  }

  broadcastEvent(event: string, data: unknown): void {
    this.clients.forEach((client) => {
      try {
        client.res.write(`event: ${event}\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch {
        this.removeClient(client.userId);
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }

  isUserConnected(userId: string): boolean {
    return this.clients.has(userId);
  }
}

export const sseService = new SSEService();
