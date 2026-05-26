import { describe, expect, it, vi } from "vitest";
import { safeFetch } from "./safe-fetch";

describe("safeFetch", () => {
  it("removes headers with non ISO-8859-1 characters", async () => {
    const fetchMock = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);

    await safeFetch("https://example.com", {
      headers: {
        "X-Safe": "ok",
        "X-Bad": "한글",
      },
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("X-Safe")).toBe("ok");
    expect(headers.has("X-Bad")).toBe(false);

    vi.unstubAllGlobals();
  });
});
