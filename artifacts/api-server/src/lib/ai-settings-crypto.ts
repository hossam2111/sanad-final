import crypto from "node:crypto";

/**
 * Pure crypto/presets half of the AI-settings module — no DB import so unit
 * tests can load it without DATABASE_URL. Runtime persistence lives in
 * ai-settings.ts, which re-exports everything here.
 */

export type AiProvider = "gemini" | "openai" | "anthropic" | "custom";

export interface AiSettings {
  provider: AiProvider;
  model: string;
  /** Decrypted key — never serialize this to a response. */
  apiKey: string;
  /** Only used when provider === "custom" (any OpenAI-compatible endpoint). */
  baseUrl?: string;
}

export const PROVIDER_PRESETS: Record<Exclude<AiProvider, "custom">, { baseUrl: string; defaultModel: string; keyHint: string }> = {
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: "gemini-2.5-flash",
    keyHint: "AIza...",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    keyHint: "sk-...",
  },
  anthropic: {
    // Anthropic exposes an OpenAI-compatible chat completions endpoint
    baseUrl: "https://api.anthropic.com/v1/",
    defaultModel: "claude-haiku-4-5-20251001",
    keyHint: "sk-ant-...",
  },
};

// AES-256-GCM, key derived from JWT_SECRET (already a required secret for the
// server to boot, so no new secret is introduced).

function deriveKey(): Buffer {
  const secret = process.env["JWT_SECRET"] ?? "sanad-dev-secret";
  return crypto.createHash("sha256").update(`sanad-ai-settings:${secret}`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(stored: string): string {
  const [ver, ivB64, tagB64, dataB64] = stored.split(":");
  if (ver !== "v1" || !ivB64 || !tagB64 || !dataB64) throw new Error("Unrecognized secret format");
  const decipher = crypto.createDecipheriv("aes-256-gcm", deriveKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

export function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}
