DO $$
DECLARE
  sys_user_id uuid;
BEGIN
  SELECT id INTO sys_user_id FROM users WHERE email = 'physics-constants@system.local';
  IF sys_user_id IS NOT NULL THEN
    DELETE FROM constants WHERE created_by = sys_user_id;
    DELETE FROM users WHERE id = sys_user_id;
  END IF;
END $$;
