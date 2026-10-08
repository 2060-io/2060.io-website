import { describe, expect, it } from "vitest";
import { documentKey, guessContentType, safeFilename } from "./documents";

describe("guessContentType", () => {
  it("maps common extensions and falls back to octet-stream", () => {
    expect(guessContentType("Deck.PDF")).toBe("application/pdf");
    expect(guessContentType("memo.md")).toBe("text/markdown");
    expect(guessContentType("deck.html")).toBe("text/html");
    expect(guessContentType("model.xlsx")).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(guessContentType("cover.png")).toBe("image/png");
    expect(guessContentType("whatever.bin")).toBe("application/octet-stream");
    expect(guessContentType("noext")).toBe("application/octet-stream");
  });
});

describe("storage keys", () => {
  it("keeps names readable but safe", () => {
    expect(safeFilename("Investor Deck (v11).pdf")).toBe("Investor-Deck-v11-.pdf");
    expect(safeFilename("../../etc/passwd")).toBe("etc-passwd");
    expect(documentKey("abc", 2, "a b.pdf")).toBe("documents/abc/v2-a-b.pdf");
  });
});
