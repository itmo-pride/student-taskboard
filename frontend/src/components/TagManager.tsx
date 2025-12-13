import { useState, useEffect } from 'react';
import { tagsAPI } from '../api/client';
import { TagWithCount, ProjectRole } from '../types';
import TagBadge from './TagBadge';

interface Props {
  projectId: string;
  currentUserRole: ProjectRole;
}

const PRESET_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#34495e', '#95a5a6', '#d35400',
];

export default function TagManager({ projectId, currentUserRole }: Props) {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [editingTag, setEditingTag] = useState<TagWithCount | null>(null);

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  useEffect(() => {
    loadTags();
  }, [projectId]);

  const loadTags = async () => {
    try {
      const response = await tagsAPI.getByProject(projectId);
      setTags(response.data || []);
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await tagsAPI.create(projectId, newTagName.trim(), newTagColor);
      setNewTagName('');
      setNewTagColor(PRESET_COLORS[0]);
      setShowForm(false);
      loadTags();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create tag');
    }
  };

  const handleUpdate = async () => {
    if (!editingTag || !editingTag.name.trim()) return;

    try {
      await tagsAPI.update(editingTag.id, { 
        name: editingTag.name.trim(), 
        color: editingTag.color 
      });
      setEditingTag(null);
      loadTags();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update tag');
    }
  };

  const handleDelete = async (tagId: string, tagName: string) => {
    if (!confirm(`Delete tag "${tagName}"? It will be removed from all tasks.`)) return;

    try {
      await tagsAPI.delete(tagId);
      loadTags();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete tag');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading tags...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}> Tags ({tags.length})</h3>
        {canManage && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            style={styles.addButton}
          >
            {showForm ? 'Cancel' : '+ New Tag'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={styles.form}>
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name..."
            style={styles.input}
            maxLength={50}
            autoFocus
          />
          <div style={styles.colorPicker}>
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTagColor(color)}
                style={{
                  ...styles.colorBtn,
                  backgroundColor: color,
                  ...(newTagColor === color ? styles.colorBtnActive : {}),
                }}
              />
            ))}
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              style={styles.colorInput}
            />
          </div>
          <div style={styles.previewRow}>
            <span style={styles.previewLabel}>Preview:</span>
            {newTagName && (
              <TagBadge 
                tag={{ id: '', project_id: '', name: newTagName, color: newTagColor, created_by: '', created_at: '' }} 
                size="medium"
              />
            )}
          </div>
          <button type="submit" style={styles.createButton}>
            Create Tag
          </button>
        </form>
      )}

      {tags.length === 0 ? (
        <div style={styles.empty}>
          No tags yet. Create tags to organize your tasks!
        </div>
      ) : (
        <div style={styles.tagsList}>
          {tags.map((tag) => (
            <div key={tag.id} style={styles.tagItem}>
              {editingTag?.id === tag.id ? (
                <div style={styles.editForm}>
                  <input
                    type="text"
                    value={editingTag.name}
                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                    style={styles.editInput}
                    autoFocus
                  />
                  <input
                    type="color"
                    value={editingTag.color}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                    style={styles.colorInput}
                  />
                  <button onClick={handleUpdate} style={styles.saveBtn}>✓</button>
                  <button onClick={() => setEditingTag(null)} style={styles.cancelBtn}>✕</button>
                </div>
              ) : (
                <>
                  <TagBadge tag={tag} size="medium" />
                  <span style={styles.taskCount}>
                    {tag.task_count} task{tag.task_count !== 1 ? 's' : ''}
                  </span>
                  {canManage && (
                    <div style={styles.tagActions}>
                      <button 
                        onClick={() => setEditingTag(tag)} 
                        style={styles.editBtn}
                        title="Edit tag"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(tag.id, tag.name)} 
                        style={styles.deleteBtn}
                        title="Delete tag"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
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
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  form: {
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #27ae60',
    borderRadius: '6px',
    fontSize: '1rem',
    marginBottom: '0.75rem',
  },
  colorPicker: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '0.75rem',
  },
  colorBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '2px solid transparent',
    cursor: 'pointer',
    padding: 0,
  },
  colorBtnActive: {
    border: '2px solid #333',
    transform: 'scale(1.15)',
  },
  colorInput: {
    width: '28px',
    height: '28px',
    padding: 0,
    border: 'none',
    cursor: 'pointer',
  },
  previewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  previewLabel: {
    fontSize: '0.85rem',
    color: '#666',
  },
  createButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  empty: {
    textAlign: 'center',
    padding: '1.5rem',
    color: '#999',
    fontSize: '0.9rem',
  },
  tagsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  tagItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  taskCount: {
    fontSize: '0.8rem',
    color: '#666',
    marginLeft: 'auto',
  },
  tagActions: {
    display: 'flex',
    gap: '0.25rem',
  },
  editBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '0.25rem',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '0.25rem',
  },
  editForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
  },
  editInput: {
    flex: 1,
    padding: '0.4rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  saveBtn: {
    padding: '0.3rem 0.6rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '0.3rem 0.6rem',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
