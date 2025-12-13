import { useState, useEffect } from 'react';
import { tagsAPI } from '../api/client';
import { Tag, TagWithCount } from '../types';
import TagBadge from './TagBadge';

interface Props {
  taskId: string;
  projectId: string;
  currentTags: Tag[];
  onTagsChange: () => void;
}

export default function TaskTagSelector({ taskId, projectId, currentTags, onTagsChange }: Props) {
  const [projectTags, setProjectTags] = useState<TagWithCount[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProjectTags();
    }
  }, [isOpen, projectId]);

  const loadProjectTags = async () => {
    try {
      setLoading(true);
      const response = await tagsAPI.getByProject(projectId);
      setProjectTags(response.data || []);
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const isTagSelected = (tagId: string) => {
    return currentTags.some(t => t.id === tagId);
  };

  const handleToggleTag = async (tag: TagWithCount) => {
    try {
      if (isTagSelected(tag.id)) {
        await tagsAPI.removeFromTask(taskId, tag.id);
      } else {
        await tagsAPI.addToTask(taskId, tag.id);
      }
      onTagsChange();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update tags');
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await tagsAPI.removeFromTask(taskId, tagId);
      onTagsChange();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove tag');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.currentTags}>
        {currentTags.length > 0 ? (
          currentTags.map(tag => (
            <TagBadge 
              key={tag.id} 
              tag={tag} 
              onRemove={() => handleRemoveTag(tag.id)}
            />
          ))
        ) : (
          <span style={styles.noTags}>No tags</span>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          style={styles.addBtn}
          title="Manage tags"
        >
          +
        </button>
      </div>

      {isOpen && (
        <div style={styles.dropdown}>
          {loading ? (
            <div style={styles.dropdownLoading}>Loading...</div>
          ) : projectTags.length === 0 ? (
            <div style={styles.dropdownEmpty}>No tags in project</div>
          ) : (
            projectTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleToggleTag(tag)}
                style={{
                  ...styles.tagOption,
                  ...(isTagSelected(tag.id) ? styles.tagOptionSelected : {}),
                }}
              >
                <span 
                  style={{
                    ...styles.tagDot,
                    backgroundColor: tag.color,
                  }}
                />
                <span style={styles.tagName}>{tag.name}</span>
                {isTagSelected(tag.id) && <span style={styles.checkmark}>✓</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
  },
  currentTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.25rem',
    alignItems: 'center',
  },
  noTags: {
    fontSize: '0.75rem',
    color: '#999',
    fontStyle: 'italic',
  },
  addBtn: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: '1px dashed #aaa',
    backgroundColor: 'transparent',
    color: '#666',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '0.25rem',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 100,
    minWidth: '180px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  dropdownLoading: {
    padding: '1rem',
    textAlign: 'center',
    color: '#666',
    fontSize: '0.85rem',
  },
  dropdownEmpty: {
    padding: '1rem',
    textAlign: 'center',
    color: '#999',
    fontSize: '0.85rem',
  },
  tagOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '0.85rem',
  },
  tagOptionSelected: {
    backgroundColor: '#e8f4f8',
  },
  tagDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  tagName: {
    flex: 1,
  },
  checkmark: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
};
