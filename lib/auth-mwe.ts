import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { getSupabaseClient } from "./supabase-safe";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client not available");
      return;
    }

    // Use scheme-based redirect for Expo Go development
    const redirectUri = makeRedirectUri({
      scheme: 'ratesnap',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUri },
    });

    if (error) throw error;

    console.log("Google login success:", data);
  } catch (err) {
    console.error("Google login error:", err);
  }
}

export async function signInWithApple() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client not available");
      return;
    }

    // Use scheme-based redirect for Expo Go development
    const redirectUri = makeRedirectUri({
      scheme: 'ratesnap',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: redirectUri },
    });

    if (error) throw error;

    console.log("Apple login success:", data);
  } catch (err) {
    console.error("Apple login error:", err);
  }
}