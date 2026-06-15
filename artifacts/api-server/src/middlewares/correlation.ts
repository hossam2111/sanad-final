import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

export type CorrelatedRequest = Request & { id?: string };

function normalizeRequestId(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.length <= 128 ? trimmed : trimmed.slice(0, 128);
}

export function getRequestId(req: Request): string {
  const correlated = req as CorrelatedRequest;
  if (!correlated.id) {
    correlated.id = normalizeRequestId(req.headers["x-request-id"]) ?? randomUUID();
  }
  return correlated.id;
}

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const reqId = getRequestId(req);
  res.setHeader("X-Request-ID", reqId);
  next();
}
