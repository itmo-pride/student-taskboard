DO $$
DECLARE
  sys_user_id uuid;
BEGIN
  SELECT id INTO sys_user_id FROM users WHERE email = 'physics-constants@system.local';
  IF sys_user_id IS NULL THEN
    INSERT INTO users (id, email, password, name)
    VALUES (uuid_generate_v4(), 'physics-constants@system.local', 'disabled', 'Physics Constants (System)')
    RETURNING id INTO sys_user_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='c' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Speed of light in vacuum', 'c', '299792458', 'm/s', 'Exact by SI definition', 'global', sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='h' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Planck constant', 'h', '6.62607015e-34', 'J·s', 'Exact by SI definition', 'global', sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='ħ' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Reduced Planck constant', 'ħ', '1.054571817e-34', 'J·s', 'Defined as h / (2π)', 'global', sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='e' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Elementary charge', 'e', '1.602176634e-19', 'C', 'Exact by SI definition', 'global', sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='N_A' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Avogadro constant', 'N_A', '6.02214076e23', 'mol^-1', 'Exact by SI definition', 'global', sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='k_B' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Boltzmann constant', 'k_B', '1.380649e-23', 'J·K^-1', 'Exact by SI definition', 'global', sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='G' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Newtonian constant of gravitation', 'G', '6.67430e-11', 'm^3·kg^-1·s^-2', 'CODATA recommended (with uncertainty)', 'global', sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='m_e' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Electron mass', 'm_e', '9.1093837015e-31', 'kg', 'CODATA recommended', 'global', sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='m_p' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Proton mass', 'm_p', '1.67262192369e-27', 'kg', 'CODATA recommended', 'global', sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='ε0' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Vacuum permittivity', 'ε0', '8.8541878128e-12', 'F·m^-1', 'Derived from α, c, h, e (not exact post-2019)', 'global', sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='μ0' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Vacuum permeability', 'μ0', '1.25663706212e-6', 'N·A^-2', 'Derived (not exact post-2019)', 'global', sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='R' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Molar gas constant', 'R', '8.314462618', 'J·mol^-1·K^-1', 'Exact = k_B*N_A product', 'global', sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM constants WHERE symbol='σ' AND scope='global') THEN
    INSERT INTO constants (name, symbol, value, unit, description, scope, created_by)
    VALUES ('Stefan–Boltzmann constant', 'σ', '5.670374419e-8', 'W·m^-2·K^-4', 'Derived constant', 'global', sys_user_id);
  END IF;

END $$;
