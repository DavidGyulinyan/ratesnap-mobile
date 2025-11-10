import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { Alert } from 'react-native'
import { getSupabaseClient } from '../lib/supabase-safe'

WebBrowser.maybeCompleteAuthSession()

export async function signInWithGoogle() {
  // Use the correct redirect URI format
  const redirectTo = AuthSession.makeRedirectUri({
    scheme: "ratesnap-mobile",
    path: "auth"
  })

  console.log("Redirect URI:", redirectTo)
  Alert.alert("Redirect URI", redirectTo)

  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  })

  if (error) console.log("AUTH ERROR:", error)
  return data
}
