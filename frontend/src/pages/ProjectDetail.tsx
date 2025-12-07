import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api/client';
import { Project, ProjectRole } from '../types';
import ProjectMembers from '../components/ProjectMembers';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const [myRole, setMyRole] = useState<ProjectRole>('member');
  const [roleLoading, setRoleLoading] = useState(true);

  const isOwner = myRole === 'owner';
  const isAdmin = myRole === 'admin';
  const canEdit = isOwner;

  useEffect(() => {
    loadProject();
    loadMyRole();
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

  const loadMyRole = async () => {
    try {
      const response = await projectsAPI.getMyRole(id!);
      setMyRole(response.data.role);
    } catch (err) {
      console.error('Failed to load role', err);
    } finally {
      setRoleLoading(false);
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

  const handleOwnershipTransferred = () => {
    loadProject();
    loadMyRole();
  };

  if (loading || roleLoading) return <div style={styles.loading}>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div>
      <button onClick={() => navigate('/projects')} style={styles.backButton}>
        ← Back to Projects
      </button>

      <div style={styles.layout}>
        <div style={styles.mainContent}>
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
                  <div>
                    <h1>{project.name}</h1>
                    <span style={{
                      ...styles.myRoleBadge,
                      backgroundColor: myRole === 'owner' ? '#f39c12' : myRole === 'admin' ? '#9b59b6' : '#95a5a6'
                    }}>
                      {myRole === 'owner' ? '👑' : myRole === 'admin' ? '⚡' : '👤'} You are {myRole}
                    </span>
                  </div>
                  <div style={styles.headerActions}>
                    <button 
                      onClick={() => navigate(`/projects/${id}/tasks`)} 
                      style={styles.tasksButton}
                    >
                      📋 View Tasks
                    </button>
                    {canEdit && (
                      <button onClick={() => setEditing(true)} style={styles.button}>
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                <p style={styles.description}>{project.description || 'No description'}</p>
                <div style={styles.meta}>
                  <p>Created: {new Date(project.created_at).toLocaleDateString()}</p>
                  <p>Updated: {new Date(project.updated_at).toLocaleDateString()}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={styles.sidebar}>
          <ProjectMembers 
            projectId={id!} 
            currentUserRole={myRole}
            onOwnershipTransferred={handleOwnershipTransferred}
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.2rem',
    color: '#666',
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '1.5rem',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '1.5rem',
    alignItems: 'start',
  },
  mainContent: {
    minWidth: 0,
  },
  sidebar: {
    position: 'sticky',
    top: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    gap: '1rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  myRoleBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    color: 'white',
    marginTop: '0.5rem',
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
  tasksButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
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
  description: {
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  meta: {
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
    color: '#999',
    fontSize: '0.9rem',
  },
};
