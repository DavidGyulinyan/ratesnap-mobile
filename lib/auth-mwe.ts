import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { getSupabaseClient } from "./supabase-safe";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
  try {
    const supabase = getSupabaseClient();

    const redirectUri = makeRedirectUri({
      scheme: "ratesnap-mobile://auth/callback",
      path: "auth",
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUri },
    });

    if (error) throw error;
    console.log("Google login launched:", data);
  } catch (err) {
    console.error("Google login error:", err);
  }
}
