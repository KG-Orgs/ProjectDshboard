import { describe, expect, it } from "vitest";
import path from "node:path";
import { guessMimeType, isLocalCorpusItemId, resolveLocalCorpusAbsolutePath } from "./local-corpus.utils";

describe("local-corpus.utils", () => {
  it("detects local corpus item ids", () => {
    expect(isLocalCorpusItemId("local:MLJ-017/file.pdf")).toBe(true);
    expect(isLocalCorpusItemId("onedrive-item-1")).toBe(false);
  });

  it("resolves from deep link url", () => {
    const resolved = resolveLocalCorpusAbsolutePath({
      deepLinkUrl: "file:///tmp/corpus/QWP-001.pdf",
    });
    expect(resolved).toBe(path.resolve("/tmp/corpus/QWP-001.pdf"));
  });

  it("resolves from local item id and corpus parent", () => {
    const resolved = resolveLocalCorpusAbsolutePath({
      onedriveItemId: "local:MLJ-017/05 - SUBMITTALS/QWP-001.pdf",
      corpusParent: "/data/onedrive",
    });
    expect(resolved).toBe(path.join("/data/onedrive", "MLJ-017/05 - SUBMITTALS/QWP-001.pdf"));
  });

  it("guesses pdf mime type", () => {
    expect(guessMimeType("QWP-001.pdf")).toBe("application/pdf");
  });
});
