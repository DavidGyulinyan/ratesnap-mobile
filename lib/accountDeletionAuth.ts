import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";
import { completeNativeOAuthExchange } from "@/lib/supabaseNativeOAuth";

export type AccountDeletionAuthKind = "password" | "google" | "apple";

/**
 * How the user should re-authenticate before destructive account deletion.
 * Priority: email/password identity first, then Google, then Apple.
 */
function collectAuthProviders(user: User): Set<string> {
  const providers = new Set<string>();
  for (const identity of user.identities ?? []) {
    if (identity.provider) providers.add(identity.provider);
  }
  const metaProviders = user.app_metadata?.providers;
  if (Array.isArray(metaProviders)) {
    for (const p of metaProviders) {
      if (typeof p === "string") providers.add(p);
    }
  }
  return providers;
}

export function getAccountDeletionAuthKind(
  user: User | null
): AccountDeletionAuthKind | null {
  if (!user) return null;
  const providers = collectAuthProviders(user);
  if (providers.size === 0) return null;
  if (providers.has("email")) return "password";
  if (providers.has("google")) return "google";
  if (providers.has("apple")) return "apple";
  return null;
}

/** True when the user signed in with email + password (can change password in settings). */
export function userHasPasswordAuth(user: User | null): boolean {
  return getAccountDeletionAuthKind(user) === "password";
}

const WRONG_OAUTH_ACCOUNT: AuthError = {
  message: "WRONG_OAUTH_ACCOUNT",
  name: "WrongOAuthAccount",
} as AuthError;

/**
 * Runs Google or Apple OAuth and ensures the signed-in user id matches the current session.
 * Restores the previous session if the user cancels or signs in as a different account.
 */
export async function reauthenticateOAuthForDeletion(
  supabase: SupabaseClient | null,
  provider: "google" | "apple"
): Promise<{ error?: AuthError }> {
  if (!supabase) {
    return {
      error: { message: "Authentication service not available" } as AuthError,
    };
  }

  const {
    data: { user: before },
  } = await supabase.auth.getUser();
  if (!before) {
    return {
      error: { message: "Not signed in" } as AuthError,
    };
  }
  const expectedId = before.id;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const backup =
    session?.access_token && session?.refresh_token
      ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }
      : null;

  const oauth = await completeNativeOAuthExchange(supabase, provider);
  if (oauth.error) {
    if (backup) {
      const {
        data: { user: check },
      } = await supabase.auth.getUser();
      if (check?.id !== expectedId) {
        await supabase.auth.setSession(backup);
      }
    }
    return oauth;
  }

  const {
    data: { user: after },
  } = await supabase.auth.getUser();
  if (!after || after.id !== expectedId) {
    if (backup) {
      await supabase.auth.setSession(backup);
    }
    return { error: WRONG_OAUTH_ACCOUNT };
  }

  return {};
}
