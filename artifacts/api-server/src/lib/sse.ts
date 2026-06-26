import type { Response } from "express";

interface SseClient {
  id: string;
  role: string;
  res: Response;
  heartbeat: NodeJS.Timeout;
  hospitalId?: string;
  patientId?: number;
}

const clients: Map<string, SseClient> = new Map();
let messagesSent = 0;
let writeFailureCount = 0;

export function registerSseClient(id: string, role: string, res: Response, hospitalId?: string, patientId?: number) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  res.write("retry: 5000\n");

  // Push an initial comment immediately. Headers alone don't always flush
  // through a buffering dev proxy (Next rewrites), so the browser's `onopen`
  // can hang — leaving the UI stuck on "Connecting…". A first body byte forces
  // the flush and the connection registers as live at once.
  res.write(": connected\n\n");

  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      writeFailureCount += 1;
      clearInterval(heartbeat);
      clients.delete(id);
    }
  }, 25000);

  const client: SseClient = { id, role, res, heartbeat, hospitalId, patientId };
  clients.set(id, client);

  res.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(id);
  });
}

export function broadcastToRole(
  role: string,
  event: string,
  data: Record<string, unknown>
) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    if (client.role === role || client.role === "admin") {
      try {
        client.res.write(payload);
        messagesSent += 1;
      } catch {
        writeFailureCount += 1;
        clients.delete(client.id);
      }
    }
  }
}

export function broadcastToHospital(
  hospitalId: string,
  event: string,
  data: Record<string, unknown>
) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    if (client.hospitalId === hospitalId || client.role === "admin") {
      try {
        client.res.write(payload);
        messagesSent += 1;
      } catch {
        writeFailureCount += 1;
        clients.delete(client.id);
      }
    }
  }
}

export function broadcastToPatient(
  patientId: number,
  event: string,
  data: Record<string, unknown>
) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    if (client.patientId === patientId || client.role === "admin") {
      try {
        client.res.write(payload);
        messagesSent += 1;
      } catch {
        writeFailureCount += 1;
        clients.delete(client.id);
      }
    }
  }
}

export function broadcastToAll(event: string, data: Record<string, unknown>) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    try {
      client.res.write(payload);
      messagesSent += 1;
    } catch {
      writeFailureCount += 1;
      clients.delete(client.id);
    }
  }
}

export function getConnectedCount(): number {
  return clients.size;
}

export function getSseMetrics() {
  return {
    connectedClients: clients.size,
    messagesSent,
    writeFailureCount,
  };
}

export function closeSseClients(): number {
  const count = clients.size;
  for (const client of clients.values()) {
    clearInterval(client.heartbeat);
    try {
      client.res.end();
    } catch {
      writeFailureCount += 1;
    }
  }
  clients.clear();
  return count;
}
