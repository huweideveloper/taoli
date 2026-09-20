export interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  shouldRetry: (error: unknown, attempt: number) => boolean;
}

export const retry = async <T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= options.maxRetries || !options.shouldRetry(error, attempt)) throw error;
      await new Promise((resolve) => setTimeout(resolve, options.delayMs * 2 ** attempt));
    }
  }
};
