import { useState, useEffect } from 'react';
import { formulasAPI } from '../api/client';
import { Formula } from '../types';

export default function Formulas() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [latex, setLatex] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadFormulas();
  }, []);

  const loadFormulas = async () => {
    try {
      const response = await formulasAPI.getAll();
      setFormulas(response.data);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this formula?')) return;

    try {
      await formulasAPI.delete(id);
      loadFormulas();
    } catch (err) {
      alert('Failed to delete formula');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1>Formulas</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.button}>
          {showForm ? 'Cancel' : 'New Formula'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={styles.input}
              placeholder="e.g., Einstein's Mass-Energy Equivalence"
            />
          </div>

          <div style={styles.field}>
            <label>LaTeX Formula</label>
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              required
              rows={3}
              style={styles.input}
              placeholder="e.g., E = mc^2"
            />
            <small style={styles.hint}>
              Enter LaTeX code (e.g., E = mc^2 or \frac{1}{2}mv^2)
            </small>
          </div>

          <div style={styles.field}>
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>Create Formula</button>
        </form>
      )}

      <div style={styles.grid}>
        {formulas.map((formula) => (
          <div key={formula.id} style={styles.card}>
            <h3>{formula.title}</h3>

            <div style={styles.latexContainer}>
              <code style={styles.latex}>{formula.latex}</code>
            </div>

            {formula.description && (
              <p style={styles.description}>{formula.description}</p>
            )}

            <div style={styles.meta}>
              <small>Created: {new Date(formula.created_at).toLocaleDateString()}</small>
            </div>

            <div style={styles.actions}>
              <button
                onClick={() => handleDelete(formula.id)}
                style={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {formulas.length === 0 && (
        <p style={styles.empty}>No formulas yet. Add your first formula!</p>
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
    padding: '1rem',
    borderRadius: '4px',
    margin: '1rem 0',
    overflow: 'auto',
  },
  latex: {
    fontFamily: 'monospace',
    fontSize: '1.1rem',
    color: '#2c3e50',
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
