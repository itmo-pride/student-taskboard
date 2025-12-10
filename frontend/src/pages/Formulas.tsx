import { useState, useEffect } from 'react';
import { formulasAPI } from '../api/client';
import { Formula } from '../types';
import LatexRenderer from '../components/LatexRenderer';

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
      await formulasAPI.create({ title, latex, description });
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


  if (loading) return <div style={styles.loading}>Loading formulas...</div>;

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
              style={{ ...styles.input, fontFamily: 'monospace' }}
              placeholder="e.g., E = mc^2 or \frac{1}{2}mv^2"
            />
            <div style={styles.hint}>
              <strong>Examples:</strong> E = mc^2 • \frac{'{a}{b}'} • \sqrt{'{x}'} • \int_0^\infty • \sum_{'{n=1}'}^N
            </div>
          </div>

          {latex && (
            <div style={styles.preview}>
              <label style={styles.previewLabel}>Live Preview:</label>
              <div style={styles.previewBox}>
                <LatexRenderer math={latex} block />
              </div>
            </div>
          )}

          <div style={styles.field}>
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={styles.input}
              placeholder="Explain what this formula represents..."
            />
          </div>

          <button type="submit" style={styles.button}>Create Formula</button>
        </form>
      )}

      <details style={styles.reference}>
        <summary style={styles.referenceSummary}>LaTeX Quick Reference</summary>
        <div style={styles.referenceContent}>
          <div style={styles.refGrid}>
            <RefItem code="x^2" description="Superscript" />
            <RefItem code="x_i" description="Subscript" />
            <RefItem code="\frac{a}{b}" description="Fraction" />
            <RefItem code="\sqrt{x}" description="Square root" />
            <RefItem code="\int_a^b" description="Integral" />
            <RefItem code="\sum_{i=1}^n" description="Sum" />
            <RefItem code="\partial" description="Partial" />
            <RefItem code="\nabla" description="Nabla" />
            <RefItem code="\alpha, \beta, \gamma" description="Greek" />
            <RefItem code="\hbar" description="h-bar" />
            <RefItem code="\infty" description="Infinity" />
            <RefItem code="\vec{v}" description="Vector" />
          </div>
        </div>
      </details>

      <div style={styles.grid}>
        {formulas.map((formula) => (
          <div key={formula.id} style={styles.card}>
            <h3 style={styles.cardTitle}>{formula.title}</h3>

            <div style={styles.formulaBox}>
              <LatexRenderer math={formula.latex} block />
            </div>

            <details style={styles.sourceCode}>
              <summary style={styles.sourceCodeSummary}>View LaTeX source</summary>
              <code style={styles.code}>{formula.latex}</code>
            </details>

            {formula.description && (
              <p style={styles.description}>{formula.description}</p>
            )}

            <div style={styles.cardFooter}>
              <small style={styles.date}>
                {new Date(formula.created_at).toLocaleDateString()}
              </small>
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

function RefItem({ code, description }: { code: string; description: string }) {
  return (
    <div style={styles.refItem}>
      <LatexRenderer math={code} />
      <code style={styles.refCode}>{code}</code>
      <span style={styles.refDesc}>{description}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
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
    fontSize: '1rem',
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
  },
  hint: {
    marginTop: '0.5rem',
    fontSize: '0.85rem',
    color: '#666',
    backgroundColor: '#f8f9fa',
    padding: '0.5rem',
    borderRadius: '4px',
  },
  preview: {
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#e8f4f8',
    borderRadius: '8px',
    border: '2px solid #3498db',
  },
  previewLabel: {
    fontWeight: 600,
    color: '#2980b9',
    marginBottom: '0.5rem',
    display: 'block',
  },
  previewBox: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '4px',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
  },
  reference: {
    marginBottom: '2rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  referenceSummary: {
    cursor: 'pointer',
    fontWeight: 600,
    color: '#2c3e50',
  },
  referenceContent: {
    marginTop: '1rem',
  },
  refGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.75rem',
  },
  refItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  refCode: {
    backgroundColor: '#eee',
    padding: '0.15rem 0.4rem',
    borderRadius: '3px',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
  },
  refDesc: {
    color: '#666',
    fontSize: '0.8rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.15rem',
    color: '#2c3e50',
  },
  formulaBox: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    border: '1px solid #eee',
    minHeight: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
  },
  sourceCode: {
    marginBottom: '1rem',
  },
  sourceCodeSummary: {
    cursor: 'pointer',
    fontSize: '0.85rem',
    color: '#666',
  },
  code: {
    display: 'block',
    marginTop: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    overflowX: 'auto',
  },
  description: {
    fontSize: '0.9rem',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '1rem',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
  },
  date: {
    color: '#999',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: '3rem',
    fontSize: '1.1rem',
  },
};
