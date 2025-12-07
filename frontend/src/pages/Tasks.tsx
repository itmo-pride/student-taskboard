import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI } from '../api/client';
import { Task } from '../types';

export default function Tasks() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');

  useEffect(() => {
    if (projectId) {
      loadTasks();
    }
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading tasks for project:', projectId);
      
      const response = await tasksAPI.getByProject(projectId!);
      console.log('Tasks response:', response.data); 
      
      
      const tasksData = Array.isArray(response.data) ? response.data : [];
      setTasks(tasksData);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load tasks');
      setTasks([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('Creating task:', { title, description, status, priority }); 
      await tasksAPI.create(projectId!, {
        title,
        description,
        status,
        priority,
      });
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setShowForm(false);
      loadTasks();
    } catch (err: any) {
      console.error('Failed to create task:', err);
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      loadTasks();
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await tasksAPI.delete(taskId);
      loadTasks();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  
  const groupedTasks = {
    todo: tasks?.filter((t) => t.status === 'todo') ?? [],
    in_progress: tasks?.filter((t) => t.status === 'in_progress') ?? [],
    done: tasks?.filter((t) => t.status === 'done') ?? [],
  };

  
  if (loading) {
    return (
      <div style={styles.container}>
        <button onClick={() => navigate('/projects')} style={styles.backButton}>
          ← Back to Projects
        </button>
        <div style={styles.loading}>Loading tasks...</div>
      </div>
    );
  }

  
  if (error) {
    return (
      <div style={styles.container}>
        <button onClick={() => navigate('/projects')} style={styles.backButton}>
          ← Back to Projects
        </button>
        <div style={styles.error}>
          <p>Error: {error}</p>
          <button onClick={loadTasks} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/projects')} style={styles.backButton}>
        ← Back to Projects
      </button>

      <div style={styles.header}>
        <h1>Tasks</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.button}>
          {showForm ? 'Cancel' : 'New Task'}
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
              placeholder="Enter task title"
            />
          </div>

          <div style={styles.field}>
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={styles.input}
              placeholder="Enter task description"
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={styles.input}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div style={styles.field}>
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={styles.input}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <button type="submit" style={styles.button}>Create Task</button>
        </form>
      )}

      {tasks.length === 0 && !showForm && (
        <div style={styles.emptyState}>
          <p>No tasks yet for this project.</p>
          <p>Click "New Task" to create your first task!</p>
        </div>
      )}

      {tasks.length > 0 && (
        <div style={styles.board}>
          {(['todo', 'in_progress', 'done'] as const).map((statusKey) => (
            <div key={statusKey} style={styles.column}>
              <h2 style={styles.columnTitle}>
                {statusKey === 'todo'
                  ? '📋 To Do'
                  : statusKey === 'in_progress'
                  ? '🔄 In Progress'
                  : '✅ Done'}
                <span style={styles.count}>({groupedTasks[statusKey].length})</span>
              </h2>

              {groupedTasks[statusKey].length === 0 && (
                <div style={styles.emptyColumn}>No tasks</div>
              )}

              {groupedTasks[statusKey].map((task) => (
                <div key={task.id} style={styles.taskCard}>
                  <h3 style={styles.taskTitle}>{task.title}</h3>
                  {task.description && (
                    <p style={styles.taskDescription}>{task.description}</p>
                  )}
                  <div style={styles.taskMeta}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor:
                          task.priority === 'high'
                            ? '#e74c3c'
                            : task.priority === 'medium'
                            ? '#f39c12'
                            : '#95a5a6',
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div style={styles.taskActions}>
                    {statusKey !== 'todo' && (
                      <button
                        onClick={() =>
                          handleStatusChange(
                            task.id,
                            statusKey === 'in_progress' ? 'todo' : 'in_progress'
                          )
                        }
                        style={styles.moveButton}
                      >
                        ←
                      </button>
                    )}
                    {statusKey !== 'done' && (
                      <button
                        onClick={() =>
                          handleStatusChange(
                            task.id,
                            statusKey === 'todo' ? 'in_progress' : 'done'
                          )
                        }
                        style={styles.moveButton}
                      >
                        →
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(task.id)}
                      style={styles.deleteButton}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.2rem',
    color: '#666',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: '#fee',
    borderRadius: '8px',
    color: '#c33',
  },
  retryButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '1rem',
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
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    color: '#666',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    minHeight: '400px',
  },
  column: {
    backgroundColor: '#f0f2f5',
    padding: '1rem',
    borderRadius: '8px',
    minHeight: '300px',
  },
  columnTitle: {
    marginBottom: '1rem',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  count: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: 'normal',
  },
  emptyColumn: {
    textAlign: 'center',
    padding: '2rem',
    color: '#999',
    fontSize: '0.9rem',
  },
  taskCard: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '0.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  taskTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '1rem',
  },
  taskDescription: {
    fontSize: '0.85rem',
    color: '#666',
    margin: '0 0 0.5rem 0',
  },
  taskMeta: {
    marginBottom: '0.5rem',
  },
  badge: {
    display: 'inline-block',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: 'white',
    textTransform: 'uppercase',
  },
  taskActions: {
    display: 'flex',
    gap: '0.25rem',
    marginTop: '0.5rem',
  },
  moveButton: {
    padding: '0.3rem 0.6rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  deleteButton: {
    padding: '0.3rem 0.6rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    marginLeft: 'auto',
  },
};
