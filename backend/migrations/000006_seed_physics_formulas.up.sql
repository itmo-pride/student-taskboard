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

  IF NOT EXISTS (SELECT 1 FROM formulas WHERE title='Newton''s second law') THEN
    INSERT INTO formulas (title, latex, description, project_id, created_by)
    VALUES
    ('Newton''s second law', 'F = ma', 'Связь силы, массы и ускорения', NULL, sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM formulas WHERE title='Kinetic energy') THEN
    INSERT INTO formulas (title, latex, description, project_id, created_by)
    VALUES
    ('Kinetic energy', 'E_k = \frac{1}{2}mv^2', 'Кинетическая энергия точки массы m и скорости v', NULL, sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM formulas WHERE title='Potential energy (gravity)') THEN
    INSERT INTO formulas (title, latex, description, project_id, created_by)
    VALUES
    ('Potential energy (gravity)', 'U = -\,G\,\frac{m_1 m_2}{r}', 'Гравитационная потенциальная энергия', NULL, sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM formulas WHERE title='Coulomb''s law') THEN
    INSERT INTO formulas (title, latex, description, project_id, created_by)
    VALUES
    ('Coulomb''s law', 'F = k\,\frac{q_1 q_2}{r^2}', 'Сила взаимодействия точечных зарядов', NULL, sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM formulas WHERE title='Ohm''s law') THEN
    INSERT INTO formulas (title, latex, description, project_id, created_by)
    VALUES
    ('Ohm''s law', 'V = IR', 'Закон Ома для участка цепи', NULL, sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM formulas WHERE title='Ideal gas law') THEN
    INSERT INTO formulas (title, latex, description, project_id, created_by)
    VALUES
    ('Ideal gas law', 'PV = nRT', 'Уравнение состояния идеального газа', NULL, sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM formulas WHERE title='Planck relation') THEN
    INSERT INTO formulas (title, latex, description, project_id, created_by)
    VALUES
    ('Planck relation', 'E = h\nu', 'Связь энергии кванта и частоты', NULL, sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM formulas WHERE title='de Broglie wavelength') THEN
    INSERT INTO formulas (title, latex, description, project_id, created_by)
    VALUES
    ('de Broglie wavelength', '\lambda = \frac{h}{p}', 'Длина волны де Бройля', NULL, sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM formulas WHERE title='Relativistic energy') THEN
    INSERT INTO formulas (title, latex, description, project_id, created_by)
    VALUES
    ('Relativistic energy', 'E^2 = (pc)^2 + (mc^2)^2', 'Полная релятивистская энергия', NULL, sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM formulas WHERE title='Time-independent Schrödinger equation') THEN
    INSERT INTO formulas (title, latex, description, project_id, created_by)
    VALUES
    ('Time-independent Schrödinger equation', '-\frac{\hbar^2}{2m}\nabla^2 \psi + V\psi = E\psi', 'Стационарное уравнение Шрёдингера', NULL, sys_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM formulas WHERE title='Snell''s law') THEN
    INSERT INTO formulas (title, latex, description, project_id, created_by)
    VALUES
    ('Snell''s law', 'n_1 \sin \theta_1 = n_2 \sin \theta_2', 'Закон Снеллиуса преломления', NULL, sys_user_id);
  END IF;

END $$;
