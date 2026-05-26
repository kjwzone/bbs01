const FETCH_TIMEOUT_MS = 20_000;

const isLatin1 = (value: string): boolean => {
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) > 255) {
      return false;
    }
  }
  return true;
};

const sanitizeHeaders = (headers: HeadersInit | undefined): Headers | undefined => {
  if (!headers) {
    return undefined;
  }

  const output = new Headers();

  const appendPair = (key: string, value: string) => {
    if (isLatin1(key) && isLatin1(value)) {
      output.append(key, value);
    }
  };

  if (headers instanceof Headers) {
    headers.forEach((value, key) => appendPair(key, value));
    return output;
  }

  if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => appendPair(key, value));
    return output;
  }

  Object.entries(headers).forEach(([key, value]) => {
    if (typeof value === "string") {
      appendPair(key, value);
    }
  });

  return output;
};

/** Drops non ISO-8859-1 headers and applies a request timeout. */
export const safeFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const signal =
    init?.signal !== undefined
      ? init.signal
      : controller.signal;

  try {
    if (!init?.headers) {
      return await fetch(input, { ...init, signal });
    }

    const headers = sanitizeHeaders(init.headers);
    return await fetch(input, { ...init, headers, signal });
  } finally {
    clearTimeout(timeoutId);
  }
};
