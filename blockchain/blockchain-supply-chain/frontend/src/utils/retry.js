import { extractErrorReason } from "./errorUtils";

const withRetry = async (fn, retries = 3, delay = 1500) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const reason = extractErrorReason(error);
      if (reason === "Product already registered") throw error; 
      lastError = error;
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw lastError;
};

export { withRetry };
