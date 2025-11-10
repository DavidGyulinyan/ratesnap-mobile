import { supabase } from "../lib/supabase";
import * as Linking from "expo-linking";

export async function signInWithGoogle() {
  const redirectUri = Linking.createURL("/auth/callback");

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUri,
    },
  });

  if (error) {
    console.log("Google sign-in error:", error.message);
  }
}
