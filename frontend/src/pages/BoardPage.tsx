import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { boardsAPI } from '../api/client';
import { Board } from '../types/board';
import Whiteboard from '../components/Whiteboard';

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (boardId) {
      loadBoard();
    }
  }, [boardId]);

  const loadBoard = async () => {
    try {
      const response = await boardsAPI.getById(boardId!);
      setBoard(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading board...
      </div>
    );
  }

  if (error || !board) {
    return (
      <div style={styles.error}>
        <p>{error || 'Board not found'}</p>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>{board.name}</h1>
      </div>
      
      <div style={styles.whiteboardContainer}>
        <Whiteboard 
          boardId={board.id} 
          initialObjects={board.data?.objects || []} 
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 80px)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderBottom: '1px solid #eee',
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
  },
  whiteboardContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    fontSize: '1.2rem',
    color: '#666',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    gap: '1rem',
  },
};
