import { getSessionSnapshot } from "@/lib/auth/session";
import type { TokenProvider } from "./client";

// Lets admin API calls authenticate off the current session without each
// screen re-implementing token access.
export const sessionTokenProvider: TokenProvider = () =>
  getSessionSnapshot()?.accessToken ?? null;
