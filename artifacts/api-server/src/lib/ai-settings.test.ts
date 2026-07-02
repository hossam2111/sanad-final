import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret, maskKey, PROVIDER_PRESETS } from "./ai-settings-crypto.js";

describe("ai-settings crypto", () => {
  it("roundtrips plain ASCII keys", () => {
    const key = "sk-abc123DEF456ghi789";
    expect(decryptSecret(encryptSecret(key))).toBe(key);
  });

  it("roundtrips unicode and long secrets", () => {
    const key = "AIza-مفتاح-🔑-" + "x".repeat(500);
    expect(decryptSecret(encryptSecret(key))).toBe(key);
  });

  it("produces a fresh IV per encryption (no deterministic ciphertext)", () => {
    const key = "sk-same-input";
    expect(encryptSecret(key)).not.toBe(encryptSecret(key));
  });

  it("uses the v1 format: v1:<iv>:<tag>:<data>", () => {
    const parts = encryptSecret("sk-test").split(":");
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe("v1");
  });

  it("throws on tampered ciphertext (GCM auth tag)", () => {
    const stored = encryptSecret("sk-tamper-me");
    const parts = stored.split(":");
    const data = Buffer.from(parts[3]!, "base64");
    data[0] = data[0]! ^ 0xff;
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${data.toString("base64")}`;
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("throws on unrecognized format", () => {
    expect(() => decryptSecret("not-a-secret")).toThrow("Unrecognized secret format");
    expect(() => decryptSecret("v2:a:b:c")).toThrow("Unrecognized secret format");
  });
});

describe("maskKey", () => {
  it("fully masks short keys", () => {
    expect(maskKey("abc")).toBe("****");
    expect(maskKey("12345678")).toBe("****");
  });

  it("shows only first/last 4 chars of long keys", () => {
    expect(maskKey("sk-ant-api03-secretsecret-abcd")).toBe("sk-a…abcd");
  });

  it("never leaks the middle of the key", () => {
    const key = "sk-" + "S".repeat(40) + "-end1";
    expect(maskKey(key)).not.toContain("SSSS");
  });
});

describe("PROVIDER_PRESETS", () => {
  it("covers gemini, openai, anthropic with baseUrl + defaultModel + keyHint", () => {
    for (const p of ["gemini", "openai", "anthropic"] as const) {
      expect(PROVIDER_PRESETS[p].baseUrl).toMatch(/^https:\/\//);
      expect(PROVIDER_PRESETS[p].defaultModel.length).toBeGreaterThan(0);
      expect(PROVIDER_PRESETS[p].keyHint.length).toBeGreaterThan(0);
    }
  });
});
