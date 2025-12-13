import { useState, useEffect, useRef } from 'react';
import { commentsAPI, TaskComment } from '../api/client';

interface Props {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
}

export default function TaskComments({ taskId, isOpen, onClose, taskTitle }: Props) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, taskId]);

  useEffect(() => {
    if (comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentsAPI.getByTask(taskId);
      setComments(response.data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await commentsAPI.create(taskId, newComment.trim());
      setComments([...comments, response.data]);
      setNewComment('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await commentsAPI.update(commentId, editContent.trim());
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, content: editContent.trim(), updated_at: new Date().toISOString() }
          : c
      ));
      setEditingId(null);
      setEditContent('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await commentsAPI.delete(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  const startEditing = (comment: TaskComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isEdited = (comment: TaskComment) => {
    return comment.updated_at !== comment.created_at;
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>💬 Comments</h3>
            <p style={styles.subtitle}>{taskTitle}</p>
          </div>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        <div style={styles.commentsContainer}>
          {loading ? (
            <div style={styles.loading}>Loading comments...</div>
          ) : comments.length === 0 ? (
            <div style={styles.empty}>
              <span style={styles.emptyIcon}>💭</span>
              <p>No comments yet</p>
              <p style={styles.emptyHint}>Be the first to comment!</p>
            </div>
          ) : (
            <div style={styles.commentsList}>
              {comments.map((comment) => (
                <div key={comment.id} style={styles.commentItem}>
                  <div style={styles.commentAvatar}>
                    {getInitials(comment.user_name)}
                  </div>
                  <div style={styles.commentContent}>
                    <div style={styles.commentHeader}>
                      <span style={styles.commentAuthor}>{comment.user_name}</span>
                      <span style={styles.commentDate}>
                        {formatDate(comment.created_at)}
                        {isEdited(comment) && <span style={styles.edited}> (edited)</span>}
                      </span>
                    </div>
                    
                    {editingId === comment.id ? (
                      <div style={styles.editForm}>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          style={styles.editTextarea}
                          autoFocus
                        />
                        <div style={styles.editActions}>
                          <button 
                            onClick={() => handleEdit(comment.id)}
                            style={styles.saveButton}
                          >
                            Save
                          </button>
                          <button 
                            onClick={cancelEditing}
                            style={styles.cancelButton}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={styles.commentText}>{comment.content}</p>
                        {comment.user_id === currentUser.id && (
                          <div style={styles.commentActions}>
                            <button 
                              onClick={() => startEditing(comment)}
                              style={styles.actionButton}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(comment.id)}
                              style={styles.actionButtonDelete}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={styles.inputForm}>
          <div style={styles.inputWrapper}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              style={styles.input}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button 
              type="submit" 
              style={{
                ...styles.sendButton,
                opacity: submitting || !newComment.trim() ? 0.5 : 1,
              }}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? '...' : '➤'}
            </button>
          </div>
          <small style={styles.hint}>Press Enter to send, Shift+Enter for new line</small>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #eee',
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#2c3e50',
  },
  subtitle: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.85rem',
    color: '#666',
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    lineHeight: 1,
  },
  commentsContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    minHeight: '200px',
    maxHeight: '400px',
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    padding: '2rem',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    padding: '2rem',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    display: 'block',
    marginBottom: '0.5rem',
  },
  emptyHint: {
    fontSize: '0.85rem',
    marginTop: '0.25rem',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  commentItem: {
    display: 'flex',
    gap: '0.75rem',
  },
  commentAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  commentContent: {
    flex: 1,
    minWidth: 0,
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
    marginBottom: '0.25rem',
  },
  commentAuthor: {
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#2c3e50',
  },
  commentDate: {
    fontSize: '0.75rem',
    color: '#999',
  },
  edited: {
    fontStyle: 'italic',
  },
  commentText: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#333',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  commentActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '0.75rem',
    cursor: 'pointer',
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
  },
  actionButtonDelete: {
    background: 'none',
    border: 'none',
    color: '#e74c3c',
    fontSize: '0.75rem',
    cursor: 'pointer',
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
  },
  editForm: {
    marginTop: '0.5rem',
  },
  editTextarea: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.9rem',
    resize: 'vertical',
    minHeight: '60px',
  },
  editActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  saveButton: {
    padding: '0.3rem 0.75rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  cancelButton: {
    padding: '0.3rem 0.75rem',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  inputForm: {
    padding: '1rem',
    borderTop: '1px solid #eee',
  },
  inputWrapper: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '0.9rem',
    resize: 'none',
    fontFamily: 'inherit',
  },
  sendButton: {
    width: '40px',
    height: '40px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  hint: {
    display: 'block',
    marginTop: '0.5rem',
    color: '#999',
    fontSize: '0.75rem',
  },
};
