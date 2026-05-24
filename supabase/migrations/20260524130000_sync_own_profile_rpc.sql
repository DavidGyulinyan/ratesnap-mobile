-- Reliable profile sync from the app (SECURITY DEFINER bypasses RLS quirks on upsert).
CREATE OR REPLACE FUNCTION public.sync_own_profile(
  p_username TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  auth_email TEXT;
  auth_username TEXT;
  final_email TEXT;
  final_username TEXT;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT u.email, u.raw_user_meta_data->>'username'
  INTO auth_email, auth_username
  FROM auth.users AS u
  WHERE u.id = uid;

  final_email := COALESCE(NULLIF(trim(p_email), ''), auth_email);
  final_username := COALESCE(
    NULLIF(trim(p_username), ''),
    NULLIF(trim(auth_username), ''),
    NULLIF(split_part(COALESCE(auth_email, ''), '@', 1), '')
  );

  INSERT INTO public.profiles (id, email, username)
  VALUES (uid, final_email, final_username)
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    username = COALESCE(EXCLUDED.username, public.profiles.username),
    updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.sync_own_profile(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_own_profile(TEXT, TEXT) TO authenticated;
