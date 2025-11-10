import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI } from '../api/client';
import { Task } from '../types';

export default function Tasks() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getByProject(projectId!);
      setTasks(response.data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
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
    } catch (err) {
      alert('Failed to create task');
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
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
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
            />
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

      <div style={styles.board}>
        {(['todo', 'in_progress', 'done'] as const).map((status) => (
          <div key={status} style={styles.column}>
            <h2 style={styles.columnTitle}>
              {status === 'todo'
                ? 'To Do'
                : status === 'in_progress'
                ? 'In Progress'
                : 'Done'}
              ({groupedTasks[status].length})
            </h2>

            {groupedTasks[status].map((task) => (
              <div key={task.id} style={styles.taskCard}>
                <h3>{task.title}</h3>
                <p style={styles.description}>{task.description}</p>
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
                  {status !== 'todo' && (
                    <button
                      onClick={() =>
                        handleStatusChange(
                          task.id,
                          status === 'in_progress' ? 'todo' : 'in_progress'
                        )
                      }
                      style={styles.moveButton}
                    >
                      ← Move Back
                    </button>
                  )}
                  {status !== 'done' && (
                    <button
                      onClick={() =>
                        handleStatusChange(
                          task.id,
                          status === 'todo' ? 'in_progress' : 'done'
                        )
                      }
                      style={styles.moveButton}
                    >
                      Move Forward →
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
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
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  column: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '8px',
  },
  columnTitle: {
    marginBottom: '1rem',
    fontSize: '1.2rem',
  },
  taskCard: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '0.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  description: {
    fontSize: '0.9rem',
    color: '#666',
    marginTop: '0.5rem',
  },
  taskMeta: {
    marginTop: '0.5rem',
  },
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    color: 'white',
  },
  taskActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
    flexWrap: 'wrap',
  },
  moveButton: {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  deleteButton: {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
};
