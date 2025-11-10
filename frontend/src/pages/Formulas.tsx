import { useState, useEffect } from 'react';
import { formulasAPI } from '../api/client';
import { Formula } from '../types';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function Formulas() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [latex, setLatex] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadFormulas();
  }, []);

  const loadFormulas = async () => {
    try {
      const response = await formulasAPI.getAll();
      setFormulas(response.data || []);
    } catch (err) {
      console.error('Failed to load formulas', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await formulasAPI.create({
        title,
        latex,
        description,
      });
      resetForm();
      loadFormulas();
    } catch (err) {
      alert('Failed to create formula');
    }
  };

  const resetForm = () => {
    setTitle('');
    setLatex('');
    setDescription('');
    setShowForm(false);
  };

  // Helper: check whether a formula matches the search query.
  // We'll look into title, description and the latex string. For variable search like "m" we also split the latex
  // into tokens and match tokens exactly (so searching "m" will match occurrences of variable m in LaTeX).
  const matchesQuery = (f: Formula, q: string) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    // Разбиваем LaTeX формулу на токены: либо команды \name (например \lambda), либо одиночные буквы
    // Это позволит извлекать "m" и "c" из "mc" как отдельные переменные.
    const latexLower = (f.latex || '').toLowerCase();
    const matches = latexLower.match(/\\[a-z]+|[a-z]/g) || [];
    const tokens = matches.map((t: string) => (t.startsWith('\\') ? t.slice(1) : t));
    const searchToken = s.replace('\\', '');
    return tokens.includes(searchToken);
  };

  if (loading) return <div>Loading...</div>;

  const filtered = formulas.filter((f) => matchesQuery(f, query));

  return (
    <div>
      <div style={styles.header}>
        <h1>Формулы</h1>
        <div>
          <input
            type="text"
            placeholder="Поиск по переменным в формуле (например: m)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ marginRight: '0.5rem', padding: '0.5rem', borderRadius: 4 }}
          />
          <button onClick={() => setShowForm(!showForm)} style={styles.button}>
            {showForm ? 'Отмена' : 'Новая формула'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
              <label>Название</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={styles.input}
                placeholder="например: Закон взаимосвязи массы и энергии Эйнштейна"
            />
          </div>

          <div style={styles.field}>
            <label>Формула в LaTeX</label>
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              required
              rows={3}
              style={styles.input}
              placeholder="например: E = mc^2"
            />
            <small style={styles.hint}>
              Введите формулу в формате LaTeX. Примеры:
              <ul style={styles.hintList}>
                <li style={styles.hintItem}>{'E = mc^2'} (энергия-масса)</li>
                <li style={styles.hintItem}>{'\lambda = \\frac{h}{p}'} (длина волны де Бройля)</li>
                <li style={styles.hintItem}>{'\\vec{F} = m\\vec{a}'} (второй закон Ньютона)</li>
                <li style={styles.hintItem}>{'\\frac{1}{2}mv^2'} (кинетическая энергия)</li>
                <li style={styles.hintItem}>{'E = \\frac{1}{2}kx^2'} (энергия пружины)</li>
              </ul>
            </small>
          </div>

          <div style={styles.field}>
            <label>Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>Создать формулу</button>
        </form>
      )}

      <div style={styles.grid}>
        {filtered.map((formula) => (
          <div key={formula.id} style={styles.card}>
            <h3>{formula.title}</h3>

            <div style={styles.latexContainer}>
              <BlockMath math={formula.latex} errorColor="#c00" />
            </div>

            {formula.description && (
              <p style={styles.description}>{formula.description}</p>
            )}

            <div style={styles.meta}>
              <small>Создано: {new Date(formula.created_at).toLocaleDateString()}</small>
            </div>

            {/* Deletion is intentionally disabled in the UI per requirement */}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
  <p style={styles.empty}>Формулы с такой переменной не найдены. Добавьте новую формулу!</p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  form: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  field: {
    marginBottom: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    marginTop: '0.25rem',
    fontFamily: 'monospace',
  },
  hint: {
    color: '#666',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
    display: 'block',
  },
  hintList: {
    marginTop: '0.5rem',
    marginBottom: 0,
    paddingLeft: '1.5rem',
  },
  hintItem: {
    marginBottom: '0.25rem',
    fontFamily: 'monospace',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  latexContainer: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '4px',
    margin: '1rem 0',
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '1.2rem',
  },
  description: {
    fontSize: '0.9rem',
    color: '#666',
    marginTop: '0.5rem',
  },
  meta: {
    marginTop: '1rem',
    color: '#999',
  },
  actions: {
    marginTop: '1rem',
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: '2rem',
  },
};
