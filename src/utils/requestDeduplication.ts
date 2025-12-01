/**
 * Request Deduplication Utility
 * Prevents duplicate API calls for the same endpoint within a short time window
 */
class RequestDeduplication {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly DEDUP_WINDOW = 1000; // 1 second window

  /**
   * Deduplicate a request - if same request is made within window, return existing promise
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if there's a pending request for this key
    const existingRequest = this.pendingRequests.get(key);
    if (existingRequest) {
      return existingRequest as Promise<T>;
    }

    // Create new request
    const requestPromise = requestFn()
      .then((result) => {
        // Remove from pending after completion
        setTimeout(() => {
          this.pendingRequests.delete(key);
        }, this.DEDUP_WINDOW);
        return result;
      })
      .catch((error) => {
        // Remove from pending on error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store pending request
    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${url}${paramsStr}`;
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

export const requestDeduplication = new RequestDeduplication();

