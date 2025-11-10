import { useState, useEffect } from 'react';
import { constantsAPI } from '../api/client';
import { Constant } from '../types';

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
      await constantsAPI.create({
        name,
        symbol,
        value,
        unit,
        description,
        scope,
      });
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
    if (!confirm('Are you sure you want to delete this constant?')) return;

    try {
      await constantsAPI.delete(id);
      loadConstants();
    } catch (err) {
      alert('Failed to delete constant');
    }
  };

  if (loading) return <div>Loading...</div>;

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
              <label>Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                required
                style={styles.input}
                placeholder="e.g., c"
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
                placeholder="e.g., 299792458"
              />
            </div>

            <div style={styles.field}>
              <label>Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={styles.input}
                placeholder="e.g., m/s"
              />
            </div>
          </div>

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
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              style={styles.input}
            >
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
            <div style={styles.constantHeader}>
              <h3>{constant.name}</h3>
              <span
                style={{
                  ...styles.scopeBadge,
                  backgroundColor:
                    constant.scope === 'global' ? '#27ae60' : '#95a5a6',
                }}
              >
                {constant.scope}
              </span>
            </div>

            <div style={styles.formula}>
              <span style={styles.symbol}>{constant.symbol}</span>
              <span> = </span>
              <span style={styles.value}>{constant.value}</span>
              {constant.unit && <span style={styles.unit}> {constant.unit}</span>}
            </div>

            {constant.description && (
              <p style={styles.description}>{constant.description}</p>
            )}

            <div style={styles.actions}>
              <button
                onClick={() => handleDelete(constant.id)}
                style={styles.deleteButton}
              >
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  constantHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  scopeBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    color: 'white',
  },
  formula: {
    fontSize: '1.2rem',
    marginBottom: '0.5rem',
    fontFamily: 'monospace',
  },
  symbol: {
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  value: {
    color: '#2980b9',
  },
  unit: {
    color: '#666',
  },
  description: {
    fontSize: '0.9rem',
    color: '#666',
    marginTop: '0.5rem',
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
