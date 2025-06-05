export const extractErrorReason = (err) => {
  if (err?.revert?.args?.[0]) return err.revert.args[0];
  if (err?.reason) return err.reason;
  if (err?.error?.message) return err.error.message;
  if (err?.message?.includes("Internal JSON-RPC error")) return "Network or provider error. Please try again.";
  return err?.message || "Unknown error occurred";
};
