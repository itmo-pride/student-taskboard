import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api/client';
import { Project } from '../types';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await projectsAPI.getById(id!);
      setProject(response.data);
      setName(response.data.name);
      setDescription(response.data.description);
    } catch (err) {
      console.error('Failed to load project', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await projectsAPI.update(id!, { name, description });
      setEditing(false);
      loadProject();
    } catch (err) {
      alert('Failed to update project');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div>
      <button onClick={() => navigate('/projects')} style={styles.backButton}>
        ← Back to Projects
      </button>

      <div style={styles.card}>
        {editing ? (
          <form onSubmit={handleUpdate}>
            <div style={styles.field}>
              <label>Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                style={styles.input}
              />
            </div>

            <div style={styles.actions}>
              <button type="submit" style={styles.button}>Save</button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={styles.header}>
              <h1>{project.name}</h1>
              <button onClick={() => setEditing(true)} style={styles.button}>
                Edit
              </button>
            </div>
            <p>{project.description}</p>
            <div style={styles.meta}>
              <p>Created: {new Date(project.created_at).toLocaleDateString()}</p>
              <p>Updated: {new Date(project.updated_at).toLocaleDateString()}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
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
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  meta: {
    marginTop: '2rem',
    color: '#666',
    fontSize: '0.9rem',
  },
};
