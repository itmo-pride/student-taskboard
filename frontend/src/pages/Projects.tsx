import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../api/client';
import { Project } from '../types';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading projects...');
      const response = await projectsAPI.getAll();
      console.log('Projects loaded:', response.data);
      setProjects(response.data || []);
    } catch (err: any) {
      console.error('Failed to load projects', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load projects';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      await projectsAPI.create({ name, description });
      setName('');
      setDescription('');
      setShowForm(false);
      loadProjects();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create project');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsAPI.delete(id);
      loadProjects();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div>Loading projects...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <h1>Projects</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.button}>
          {showForm ? 'Cancel' : 'New Project'}
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          Error loading projects: {error}
          <button onClick={loadProjects} style={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          {formError && <div style={styles.error}>{formError}</div>}
          
          <div style={styles.field}>
            <label>Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
              placeholder="Enter project name"
            />
          </div>

          <div style={styles.field}>
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={styles.input}
              placeholder="Enter project description"
            />
          </div>

          <button type="submit" style={styles.button}>Create Project</button>
        </form>
      )}

      {!error && projects.length === 0 ? (
        <div style={styles.empty}>
          <p>No projects yet.</p>
          <p>Create your first project to get started!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map((project) => (
            <div key={project.id} style={styles.card}>
              <h3>{project.name}</h3>
              <p style={styles.description}>{project.description || 'No description'}</p>
              <div style={styles.actions}>
                <Link to={`/projects/${project.id}`} style={styles.link}>
                  View Details
                </Link>
                <Link to={`/projects/${project.id}/tasks`} style={styles.link}>
                  Tasks
                </Link>
                <button
                  onClick={() => handleDelete(project.id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    fontSize: '1.2rem',
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
  error: {
    padding: '0.75rem',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  errorAlert: {
    padding: '1rem',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retryButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
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
  description: {
    color: '#666',
    marginTop: '0.5rem',
    marginBottom: '1rem',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  link: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
    display: 'inline-block',
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
    marginTop: '3rem',
    fontSize: '1.1rem',
  },
};
