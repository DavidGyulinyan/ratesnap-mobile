import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { getSupabaseClient } from '../lib/supabase-safe'

WebBrowser.maybeCompleteAuthSession()

export async function signInWithGoogle() {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  // Create redirectUri before using it - useProxy is default for Expo Go
  const redirectTo = AuthSession.makeRedirectUri()
  console.log("DEBUG redirectTo:", redirectTo)

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })

    if (error) {
      console.error('Google OAuth error:', error)
      throw error
    }

    console.log('Google OAuth initiated successfully:', data)
  } catch (error) {
    console.error('signInWithGoogle failed:', error)
    throw error
  }
}
