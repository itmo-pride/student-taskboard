import { Link, useNavigate } from 'react-router-dom';

type Props = {
  onOpenConstants?: () => void;
  onOpenFormulas?: () => void;
};

export default function Navbar({ onOpenConstants, onOpenFormulas }: Props) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          Physics Collab
        </Link>

        {user && (
          <div style={styles.menu}>
            <Link to="/projects" style={styles.link}>Projects</Link>

            {/* было: <Link to="/constants">, теперь кнопка */}
            <button
              type="button"
              onClick={onOpenConstants}
              style={styles.linkButton}
            >
              Constants
            </button>

            {/* было: <Link to="/formulas">, теперь кнопка */}
            <button
              type="button"
              onClick={onOpenFormulas}
              style={styles.linkButton}
            >
              Formulas
            </button>

            <span style={styles.user}>{user.name}</span>
            <button onClick={handleLogout} style={styles.button}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    backgroundColor: '#333',
    color: 'white',
    padding: '1rem',
    marginBottom: '2rem',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    textDecoration: 'none',
  },
  menu: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
  },
  linkButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    font: 'inherit',
    textDecoration: 'none',
  },
  user: {
    color: '#ccc',
  },
  button: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    borderRadius: '4px',
  },
};
