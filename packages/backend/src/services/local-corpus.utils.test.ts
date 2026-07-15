import { describe, expect, it, vi } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { guessMimeType, isLocalCorpusItemId, readLocalCorpusFile, resolveLocalCorpusAbsolutePath } from "./local-corpus.utils";

// This file itself is guaranteed to exist — used to test deepLinkUrl resolution.
const THIS_FILE = fileURLToPath(import.meta.url);
const THIS_FILE_URL = new URL(import.meta.url).href;

describe("local-corpus.utils", () => {
  it("detects local corpus item ids", () => {
    expect(isLocalCorpusItemId("local:MLJ-017/file.pdf")).toBe(true);
    expect(isLocalCorpusItemId("onedrive-item-1")).toBe(false);
  });

  describe("resolveLocalCorpusAbsolutePath", () => {
    it("resolves from deep link url when file exists on disk", () => {
      const resolved = resolveLocalCorpusAbsolutePath({
        deepLinkUrl: THIS_FILE_URL,
      });
      expect(resolved).toBe(THIS_FILE);
    });

    it("falls back to corpusParent when deepLinkUrl file does not exist", () => {
      const resolved = resolveLocalCorpusAbsolutePath({
        deepLinkUrl: "file:///stale/old-onedrive/MLJ-017/file.pdf",
        onedriveItemId: "local:MLJ-017/file.pdf",
        corpusParent: "/data/new-onedrive",
      });
      expect(resolved).toBe(path.join("/data/new-onedrive", "MLJ-017/file.pdf"));
    });

    it("falls back to corpusParent when deepLinkUrl is absent", () => {
      const resolved = resolveLocalCorpusAbsolutePath({
        onedriveItemId: "local:MLJ-017/05 - SUBMITTALS/QWP-001.pdf",
        corpusParent: "/data/onedrive",
      });
      expect(resolved).toBe(path.join("/data/onedrive", "MLJ-017/05 - SUBMITTALS/QWP-001.pdf"));
    });

    it("returns null when deepLinkUrl file is absent and no corpusParent configured", () => {
      const resolved = resolveLocalCorpusAbsolutePath({
        deepLinkUrl: "file:///stale/old-onedrive/MLJ-017/file.pdf",
        onedriveItemId: "local:MLJ-017/file.pdf",
      });
      expect(resolved).toBeNull();
    });
  });

  it("guesses pdf mime type", () => {
    expect(guessMimeType("QWP-001.pdf")).toBe("application/pdf");
  });

  it("readLocalCorpusFile rejects immediately for a missing path", async () => {
    await expect(readLocalCorpusFile("/nonexistent/path/file.pdf")).rejects.toThrow(
      "local_corpus_file_missing"
    );
  });

  it("readLocalCorpusFile reads an existing file", async () => {
    const buffer = await readLocalCorpusFile(THIS_FILE);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
