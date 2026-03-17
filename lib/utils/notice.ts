export function buildNoticeUrl(
  pathname: string,
  options?: {
    message?: string;
    tone?: "success" | "error";
    params?: Record<string, string | undefined>;
  }
) {
  const searchParams = new URLSearchParams();

  if (options?.message) {
    searchParams.set("notice", options.message);
  }

  if (options?.tone) {
    searchParams.set("tone", options.tone);
  }

  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value) {
        searchParams.set(key, value);
      }
    }
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
