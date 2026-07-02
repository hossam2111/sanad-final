import crypto from "node:crypto";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { systemSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

/**
 * Runtime-configurable AI Brain settings.
 *
 * The admin can set the provider, model, and API key from the Admin panel
 * (Maintenance tab → AI Brain card). The key is AES-256-GCM encrypted with a
 * key derived from JWT_SECRET before it touches the database, and is only
 * ever returned to clients in masked form (sk-****abcd).
 *
 * Resolution order for the live client:
 *   1. DB settings saved from the Admin panel (if apiKey present)
 *   2. Environment variables (GEMINI_API_KEY → OPENAI_API_KEY) — legacy path
 *   3. null → callers fall back to Demo Mode narratives
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

const SETTINGS_KEY = "ai_brain";

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

// ---------------------------------------------------------------------------
// Encryption — AES-256-GCM, key derived from JWT_SECRET (already a required
// secret for the server to boot, so no new secret is introduced).
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Persistence + cache
// ---------------------------------------------------------------------------

let cache: { settings: AiSettings | null; ts: number } | null = null;
const CACHE_TTL_MS = 30 * 1000;

export function invalidateAiSettingsCache() {
  cache = null;
}

/** Read saved settings from DB (decrypted). Returns null if none saved. */
export async function readSavedAiSettings(): Promise<AiSettings | null> {
  const [row] = await db
    .select({ value: systemSettingsTable.value })
    .from(systemSettingsTable)
    .where(eq(systemSettingsTable.key, SETTINGS_KEY))
    .limit(1);
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as { provider: AiProvider; model: string; encryptedKey: string; baseUrl?: string };
    return {
      provider: parsed.provider,
      model: parsed.model,
      apiKey: decryptSecret(parsed.encryptedKey),
      baseUrl: parsed.baseUrl,
    };
  } catch {
    // Corrupt or written with a different JWT_SECRET — treat as unset
    return null;
  }
}

export async function saveAiSettings(input: { provider: AiProvider; model: string; apiKey: string; baseUrl?: string }, updatedBy?: string): Promise<void> {
  const value = JSON.stringify({
    provider: input.provider,
    model: input.model,
    encryptedKey: encryptSecret(input.apiKey),
    baseUrl: input.baseUrl,
  });
  await db
    .insert(systemSettingsTable)
    .values({ key: SETTINGS_KEY, value, updatedBy: updatedBy ?? null, updatedAt: new Date() })
    .onConflictDoUpdate({ target: systemSettingsTable.key, set: { value, updatedBy: updatedBy ?? null, updatedAt: new Date() } });
  invalidateAiSettingsCache();
}

export async function deleteAiSettings(): Promise<void> {
  await db.delete(systemSettingsTable).where(eq(systemSettingsTable.key, SETTINGS_KEY));
  invalidateAiSettingsCache();
}

/** Effective settings: DB first, env fallback, null → demo mode. Cached 30s. */
export async function getEffectiveAiSettings(): Promise<AiSettings | null> {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.settings;

  let settings: AiSettings | null = null;
  try {
    settings = await readSavedAiSettings();
  } catch {
    settings = null; // DB unreachable — fall through to env
  }

  if (!settings) {
    const geminiKey = process.env["GEMINI_API_KEY"];
    const openaiKey = process.env["OPENAI_API_KEY"];
    if (geminiKey && geminiKey !== "placeholder") {
      settings = { provider: "gemini", model: PROVIDER_PRESETS.gemini.defaultModel, apiKey: geminiKey, baseUrl: PROVIDER_PRESETS.gemini.baseUrl };
    } else if (openaiKey && openaiKey !== "placeholder") {
      settings = { provider: "openai", model: "gpt-4o", apiKey: openaiKey, baseUrl: PROVIDER_PRESETS.openai.baseUrl };
    }
  }

  cache = { settings, ts: Date.now() };
  return settings;
}

/** Build an OpenAI-compatible client for the effective settings. */
export function buildClient(settings: AiSettings): OpenAI {
  const baseURL = settings.baseUrl || (settings.provider !== "custom" ? PROVIDER_PRESETS[settings.provider].baseUrl : undefined);
  return new OpenAI({ apiKey: settings.apiKey, baseURL });
}

/** Fire a minimal completion to verify the key/model actually work. */
export async function testAiSettings(settings: AiSettings): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
  const started = Date.now();
  try {
    const client = buildClient(settings);
    const res = await client.chat.completions.create({
      model: settings.model,
      max_tokens: 10,
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
    });
    const text = res.choices[0]?.message?.content ?? "";
    return { ok: true, message: `Model responded: "${text.trim().slice(0, 40)}"`, latencyMs: Date.now() - started };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg.slice(0, 200), latencyMs: Date.now() - started };
  }
}
