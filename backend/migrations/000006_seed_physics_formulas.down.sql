DO $$
DECLARE
  sys_user_id uuid;
BEGIN
  SELECT id INTO sys_user_id FROM users WHERE email = 'physics-constants@system.local';
  IF sys_user_id IS NOT NULL THEN
    DELETE FROM formulas WHERE created_by = sys_user_id;
  END IF;
END $$;
