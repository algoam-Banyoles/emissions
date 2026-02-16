import { describe, expect, it } from "vitest";

import { languageMiddleware } from "./language.middleware.js";

function createRes() {
  const headers: Record<string, string> = {};
  return {
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    headers,
  };
}

describe("languageMiddleware", () => {
  it("detecta idioma des de Accept-Language", () => {
    const req: { headers: Record<string, string>; query: Record<string, string>; language?: string } = {
      headers: { "accept-language": "en-US,en;q=0.9" },
      query: {},
    };
    const res = createRes();
    let nextCalled = false;

    languageMiddleware(req as never, res as never, () => {
      nextCalled = true;
    });

    expect(req.language).toBe("en");
    expect(res.headers["Content-Language"]).toBe("en");
    expect(nextCalled).toBe(true);
  });

  it("fa fallback a catala", () => {
    const req: { headers: Record<string, string>; query: Record<string, string>; language?: string } = {
      headers: {},
      query: {},
    };
    const res = createRes();

    languageMiddleware(req as never, res as never, () => undefined);

    expect(req.language).toBe("ca");
    expect(res.headers["Content-Language"]).toBe("ca");
  });
});
