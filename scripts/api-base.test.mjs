import assert from "node:assert/strict";
import test from "node:test";
import { normalizeApiBaseUrl } from "../src/config/api-base.ts";
test("validates mobile API origins before requests are made", () => {
  assert.equal(normalizeApiBaseUrl(" http://localhost:5000/ "), "http://localhost:5000");
  assert.equal(normalizeApiBaseUrl("https://example.com", true), "https://example.com");
  for (const value of [undefined, "", "undefined", "/api", "https://example.com/api",
    "https://user:pass@example.com", "https://example.com?token=secret", "ftp://example.com"]) {
    assert.throws(() => normalizeApiBaseUrl(value), /EXPO_PUBLIC_API_URL/);
  }
  assert.throws(() => normalizeApiBaseUrl("http://example.com", true), /HTTPS/);
});
