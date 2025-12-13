import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardsAPI, Board } from '../api/client';
import { ProjectRole } from '../types';

interface Props {
  projectId: string;
  currentUserRole: ProjectRole;
}

export default function BoardList({ projectId, currentUserRole }: Props) {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const canDelete = currentUserRole === 'owner' || currentUserRole === 'admin';

  useEffect(() => {
    loadBoards();
  }, [projectId]);

  const loadBoards = async () => {
    try {
      const response = await boardsAPI.getByProject(projectId);
      setBoards(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load boards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      await boardsAPI.create(projectId, newBoardName);
      setNewBoardName('');
      setShowForm(false);
      loadBoards();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create board');
    }
  };

  const handleDelete = async (boardId: string, boardName: string) => {
    if (!confirm(`Delete board "${boardName}"?`)) return;

    try {
      await boardsAPI.delete(boardId);
      loadBoards();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete board');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading boards...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}> Whiteboards ({boards.length})</h3>
        <button onClick={() => setShowForm(!showForm)} style={styles.addButton}>
          {showForm ? 'Cancel' : '+ New Board'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={styles.form}>
          <input
            type="text"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="Board name..."
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.createButton}>
            Create
          </button>
        </form>
      )}

      {boards.length === 0 ? (
        <div style={styles.empty}>
          No whiteboards yet. Create one to start collaborating!
        </div>
      ) : (
        <div style={styles.list}>
          {boards.map((board) => (
            <div key={board.id} style={styles.boardCard}>
              <div style={styles.boardInfo}>
                <span style={styles.boardName}>{board.name}</span>
                <span style={styles.boardDate}>
                  Updated {new Date(board.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div style={styles.boardActions}>
                <button
                  onClick={() => navigate(`/boards/${board.id}`)}
                  style={styles.openButton}
                >
                  Open
                </button>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(board.id, board.name)}
                    style={styles.deleteButton}
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginTop: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#2c3e50',
  },
  addButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#9b59b6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  input: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    border: '2px solid #9b59b6',
    borderRadius: '6px',
    fontSize: '1rem',
  },
  createButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#9b59b6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    color: '#999',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  boardCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  boardInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  boardName: {
    fontWeight: 500,
    color: '#2c3e50',
  },
  boardDate: {
    fontSize: '0.8rem',
    color: '#999',
  },
  boardActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  openButton: {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '0.4rem 0.6rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
