import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI, projectsAPI } from '../api/client';
import { Task, ProjectMember, ProjectRole } from '../types';

export default function Tasks() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState<string>('');

  const [myRole, setMyRole] = useState<ProjectRole>('member');
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tasksRes, membersRes, roleRes] = await Promise.all([
        tasksAPI.getByProject(projectId!),
        projectsAPI.getMembers(projectId!),
        projectsAPI.getMyRole(projectId!), 
      ]);
      
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      setMyRole(roleRes.data.role);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  
  const canDeleteTask = (task: Task): boolean => {
    
    if (myRole === 'owner' || myRole === 'admin') {
      return true;
    }
    
    return task.created_by === currentUser.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tasksAPI.create(projectId!, {
        title,
        description,
        status,
        priority,
        assigned_to: assignedTo || null,
      });
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('todo');
    setPriority('medium');
    setAssignedTo('');
    setShowForm(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      loadData();
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const handleAssigneeChange = async (taskId: string, userId: string | null) => {
    try {
      await tasksAPI.update(taskId, { assigned_to: userId });
      loadData();
    } catch (err) {
      alert('Failed to update assignee');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;

    try {
      await tasksAPI.delete(taskId);
      loadData();
    } catch (err: any) {
      
      const errorMsg = err.response?.data?.error || 'Failed to delete task';
      alert(errorMsg);
    }
  };

  const getMemberName = (userId: string | undefined | null): string | null => {
    if (!userId) return null;
    const member = members.find(m => m.user_id === userId);
    return member?.user_name || null;
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  
  const isMyTask = (task: Task): boolean => {
    return task.created_by === currentUser.id;
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
          <button onClick={loadData} style={styles.retryButton}>Retry</button>
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
        <div>
          <h1>Tasks</h1>
          <span style={{
            ...styles.roleBadge,
            backgroundColor: myRole === 'owner' ? '#f39c12' : myRole === 'admin' ? '#9b59b6' : '#95a5a6'
          }}>
            {myRole === 'owner' ? '👑' : myRole === 'admin' ? '⚡' : '👤'} {myRole}
          </span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.memberCount}>👥 {members.length} members</span>
          <button onClick={() => setShowForm(!showForm)} style={styles.button}>
            {showForm ? 'Cancel' : '+ New Task'}
          </button>
        </div>
      </div>

      {myRole === 'member' && (
        <div style={styles.roleHint}>
          💡 As a member, you can only delete tasks you created.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.field}>
              <label>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={styles.input}
                placeholder="Enter task title"
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
              placeholder="Enter task description"
            />
          </div>

          <div style={styles.formRow}>
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

            <div style={styles.field}>
              <label>Assign To</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                style={styles.input}
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" style={styles.button}>Create Task</button>
        </form>
      )}

      <div style={styles.board}>
        {(['todo', 'in_progress', 'done'] as const).map((statusKey) => (
          <div key={statusKey} style={styles.column}>
            <h2 style={styles.columnTitle}>
              <span style={styles.columnIcon}>
                {statusKey === 'todo' ? '📋' : statusKey === 'in_progress' ? '🔄' : '✅'}
              </span>
              {statusKey === 'todo' ? 'To Do' : statusKey === 'in_progress' ? 'In Progress' : 'Done'}
              <span style={styles.count}>({groupedTasks[statusKey].length})</span>
            </h2>

            {groupedTasks[statusKey].length === 0 && (
              <div style={styles.emptyColumn}>No tasks</div>
            )}

            {groupedTasks[statusKey].map((task) => {
              const assigneeName = getMemberName(task.assigned_to);
              const canDelete = canDeleteTask(task);
              const isMine = isMyTask(task);
              
              return (
                <div 
                  key={task.id} 
                  style={{
                    ...styles.taskCard,
                    
                    ...(myRole === 'member' && isMine ? styles.myTaskCard : {})
                  }}
                >
                  <div style={styles.taskHeader}>
                    <h3 style={styles.taskTitle}>
                      {task.title}
                      {isMine && (
                        <span style={styles.myTaskBadge} title="You created this task">
                          ✍️
                        </span>
                      )}
                    </h3>
                    <span
                      style={{
                        ...styles.priorityBadge,
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

                  {task.description && (
                    <p style={styles.taskDescription}>{task.description}</p>
                  )}

                  <div style={styles.assigneeSection}>
                    <label style={styles.assigneeLabel}>Assigned to:</label>
                    <select
                      value={task.assigned_to || ''}
                      onChange={(e) => handleAssigneeChange(task.id, e.target.value || null)}
                      style={styles.assigneeSelect}
                    >
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option key={member.user_id} value={member.user_id}>
                          {member.user_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {assigneeName && (
                    <div style={styles.assigneeDisplay}>
                      <div style={styles.assigneeAvatar}>
                        {getInitials(assigneeName)}
                      </div>
                      <span style={styles.assigneeName}>{assigneeName}</span>
                    </div>
                  )}

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
                        title="Move back"
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
                        title="Move forward"
                      >
                        →
                      </button>
                    )}
                    {canDelete ? (
                      <button
                        onClick={() => handleDelete(task.id)}
                        style={styles.deleteButton}
                        title="Delete task"
                      >
                        🗑
                      </button>
                    ) : (
                      <button
                        style={styles.deleteButtonDisabled}
                        title="You can only delete your own tasks"
                        disabled
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1400px',
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
    marginBottom: '1rem',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    color: 'white',
    marginLeft: '0.5rem',
    textTransform: 'capitalize',
  },
  roleHint: {
    backgroundColor: '#e8f4f8',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    color: '#2980b9',
    fontSize: '0.9rem',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  memberCount: {
    color: '#666',
    fontSize: '0.9rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  form: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  field: {
    flex: 1,
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    marginTop: '0.25rem',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    minHeight: '500px',
  },
  column: {
    backgroundColor: '#f0f2f5',
    padding: '1rem',
    borderRadius: '12px',
    minHeight: '400px',
  },
  columnTitle: {
    marginBottom: '1rem',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#2c3e50',
  },
  columnIcon: {
    fontSize: '1.2rem',
  },
  count: {
    fontSize: '0.85rem',
    color: '#666',
    fontWeight: 'normal',
    marginLeft: 'auto',
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
    borderRadius: '10px',
    marginBottom: '0.75rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.2s',
  },
  
  myTaskCard: {
    borderLeft: '3px solid #27ae60',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
  },
  taskTitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#2c3e50',
    flex: 1,
    marginRight: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  
  myTaskBadge: {
    fontSize: '0.8rem',
  },
  priorityBadge: {
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    color: 'white',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  taskDescription: {
    fontSize: '0.85rem',
    color: '#666',
    margin: '0.5rem 0',
    lineHeight: 1.4,
  },
  assigneeSection: {
    marginTop: '0.75rem',
    padding: '0.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  assigneeLabel: {
    fontSize: '0.75rem',
    color: '#666',
    display: 'block',
    marginBottom: '0.25rem',
  },
  assigneeSelect: {
    width: '100%',
    padding: '0.4rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.85rem',
    backgroundColor: 'white',
  },
  assigneeDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  assigneeAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#9b59b6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.65rem',
    fontWeight: 'bold',
  },
  assigneeName: {
    fontSize: '0.8rem',
    color: '#555',
  },
  taskActions: {
    display: 'flex',
    gap: '0.25rem',
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #eee',
  },
  moveButton: {
    padding: '0.35rem 0.6rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  deleteButton: {
    padding: '0.35rem 0.6rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    marginLeft: 'auto',
  },
  
  deleteButtonDisabled: {
    padding: '0.35rem 0.6rem',
    backgroundColor: '#bdc3c7',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
    fontSize: '0.85rem',
    marginLeft: 'auto',
    opacity: 0.6,
  },
};
