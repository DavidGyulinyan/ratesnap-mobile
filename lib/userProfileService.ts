import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase-safe";

export interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  created_at: string;
  updated_at: string;
}

const PROFILE_SYNC_FAILED = "PROFILE_SYNC_FAILED";

export function usernameFromAuthUser(user: User): string | null {
  const fromMeta = (user.user_metadata?.username as string | undefined)?.trim();
  if (fromMeta) return fromMeta;
  const local = user.email?.split("@")[0]?.trim();
  return local || null;
}

/** True only when the profiles table (or RPC) is not deployed yet. */
function isProfilesNotDeployed(error: { code?: string; message?: string }) {
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  if (code === "PGRST205") return true;
  if (code === "PGRST202" || code === "42883") {
    return msg.includes("sync_own_profile");
  }
  return (
    msg.includes("relation") &&
    msg.includes("does not exist") &&
    msg.includes("profile")
  );
}

function isRpcUnavailable(error: { code?: string; message?: string }) {
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  return (
    code === "PGRST202" ||
    code === "42883" ||
    msg.includes("sync_own_profile") ||
    msg.includes("could not find the function")
  );
}

type SyncProfileParams = {
  userId: string;
  email?: string | null;
  username?: string | null;
};

/**
 * Writes email/username to public.profiles for the signed-in user.
 * Prefers SECURITY DEFINER RPC (bypasses RLS edge cases); falls back to client upsert.
 */
export async function syncOwnProfile(
  params: SyncProfileParams
): Promise<{ error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Authentication service not available" };
  }

  const { error: rpcError } = await supabase.rpc("sync_own_profile", {
    p_username: params.username ?? null,
    p_email: params.email ?? null,
  });

  if (!rpcError) {
    return {};
  }

  if (!isRpcUnavailable(rpcError)) {
    if (isProfilesNotDeployed(rpcError)) {
      console.warn(
        "profiles not deployed — run SQL for profiles + sync_own_profile in Supabase SQL Editor"
      );
      return {};
    }
    console.warn("sync_own_profile RPC:", rpcError);
    return { error: PROFILE_SYNC_FAILED };
  }

  const row: Record<string, string | null> = { id: params.userId };
  if (params.email !== undefined) row.email = params.email;
  if (params.username !== undefined) row.username = params.username;

  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert(row, { onConflict: "id" });

  if (upsertError) {
    if (isProfilesNotDeployed(upsertError)) {
      console.warn("profiles table missing — deploy migration in Supabase");
      return {};
    }
    console.warn("syncOwnProfile upsert:", upsertError);
    return { error: PROFILE_SYNC_FAILED };
  }

  return {};
}

/** Upsert profile row from the current auth user (backfill + session sync). */
export async function upsertProfileFromAuthUser(
  user: User
): Promise<{ error?: string }> {
  return syncOwnProfile({
    userId: user.id,
    email: user.email ?? null,
    username: usernameFromAuthUser(user),
  });
}

export async function updateProfileUsername(
  userId: string,
  username: string,
  email?: string | null
): Promise<{ error?: string }> {
  return syncOwnProfile({ userId, username, email });
}

export async function updateProfileEmail(
  userId: string,
  email: string,
  username?: string | null
): Promise<{ error?: string }> {
  return syncOwnProfile({ userId, email, username });
}

export { PROFILE_SYNC_FAILED };
