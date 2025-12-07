import { useState, useEffect } from 'react';
import { constantsAPI } from '../api/client';
import { Constant } from '../types';
import LatexRenderer from '../components/LatexRenderer';

export default function Constants() {
  const [constants, setConstants] = useState<Constant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('user');

  useEffect(() => {
    loadConstants();
  }, []);

  const loadConstants = async () => {
    try {
      const response = await constantsAPI.getAll();
      setConstants(response.data);
    } catch (err) {
      console.error('Failed to load constants', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await constantsAPI.create({ name, symbol, value, unit, description, scope });
      resetForm();
      loadConstants();
    } catch (err) {
      alert('Failed to create constant');
    }
  };

  const resetForm = () => {
    setName('');
    setSymbol('');
    setValue('');
    setUnit('');
    setDescription('');
    setScope('user');
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await constantsAPI.delete(id);
      loadConstants();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const formatConstantLatex = (c: Constant): string => {
    let latex = `${c.symbol} = ${c.value}`;
    if (c.unit) {
      const formattedUnit = formatUnit(c.unit);
      latex += `\\,\\mathrm{${formattedUnit}}`;
    }
    return latex;
  };

  const formatUnit = (unit: string): string => {
    return unit
      .replace(/\^(-?\d+)/g, '^{$1}')
      .replace(/·/g, '\\cdot ')
      .replace(/\*/g, '\\cdot ')
      .replace(/\//g, '/')
      .replace(/mol/g, 'mol')
      .replace(/kg/g, 'kg')
      .replace(/m/g, 'm')
      .replace(/s/g, 's');
  };

  if (loading) return <div style={styles.loading}>Loading constants...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1>Physical Constants</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.button}>
          {showForm ? 'Cancel' : 'New Constant'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
                placeholder="e.g., Speed of Light"
              />
            </div>
            <div style={styles.field}>
              <label>Symbol (LaTeX)</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                required
                style={styles.input}
                placeholder="e.g., c, \hbar, \epsilon_0"
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label>Value</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                style={styles.input}
                placeholder="e.g., 2.998 \times 10^8"
              />
            </div>
            <div style={styles.field}>
              <label>Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={styles.input}
                placeholder="e.g., m/s, J·s, kg"
              />
            </div>
          </div>

          {/* Предпросмотр */}
          {(symbol || value) && (
            <div style={styles.preview}>
              <label>Preview:</label>
              <div style={styles.previewBox}>
                <LatexRenderer 
                  math={formatConstantLatex({ symbol, value, unit } as Constant)} 
                  block 
                />
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
            />
          </div>

          <div style={styles.field}>
            <label>Scope</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)} style={styles.input}>
              <option value="user">User (Private)</option>
              <option value="global">Global (Public)</option>
            </select>
          </div>

          <button type="submit" style={styles.button}>Create Constant</button>
        </form>
      )}

      <div style={styles.grid}>
        {constants.map((constant) => (
          <div key={constant.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>{constant.name}</h3>
              <span
                style={{
                  ...styles.scopeBadge,
                  backgroundColor: constant.scope === 'global' ? '#27ae60' : '#95a5a6',
                }}
              >
                {constant.scope}
              </span>
            </div>

            {/* Красивый LaTeX рендеринг */}
            <div style={styles.formulaBox}>
              <LatexRenderer math={formatConstantLatex(constant)} block />
            </div>

            {constant.description && (
              <p style={styles.description}>{constant.description}</p>
            )}

            <div style={styles.actions}>
              <button onClick={() => handleDelete(constant.id)} style={styles.deleteButton}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {constants.length === 0 && (
        <p style={styles.empty}>No constants yet. Add your first constant!</p>
      )}
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
    flex: 1,
  },
  row: {
    display: 'flex',
    gap: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    marginTop: '0.25rem',
  },
  preview: {
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px dashed #ddd',
  },
  previewBox: {
    marginTop: '0.5rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '4px',
    minHeight: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#2c3e50',
  },
  scopeBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    color: 'white',
    fontWeight: 500,
  },
  formulaBox: {
    backgroundColor: '#f8f9fa',
    padding: '1.25rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    border: '1px solid #eee',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '1rem',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: '3rem',
    fontSize: '1.1rem',
  },
};
