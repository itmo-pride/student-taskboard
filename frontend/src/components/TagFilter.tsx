import { useState, useEffect } from 'react';
import { tagsAPI } from '../api/client';
import { TagWithCount } from '../types';

interface Props {
  projectId: string;
  selectedTagIds: string[];
  onFilterChange: (tagIds: string[]) => void;
}

export default function TagFilter({ projectId, selectedTagIds, onFilterChange }: Props) {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadTags();
  }, [projectId]);

  const loadTags = async () => {
    try {
      const response = await tagsAPI.getByProject(projectId);
      setTags(response.data || []);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const handleToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onFilterChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onFilterChange([...selectedTagIds, tagId]);
    }
  };

  const clearFilter = () => {
    onFilterChange([]);
  };

  if (tags.length === 0) return null;

  return (
    <div style={styles.container}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{
          ...styles.filterBtn,
          ...(selectedTagIds.length > 0 ? styles.filterBtnActive : {}),
        }}
      >
        Filter by tags
        {selectedTagIds.length > 0 && (
          <span style={styles.badge}>{selectedTagIds.length}</span>
        )}
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <span style={styles.dropdownTitle}>Filter by tags</span>
            {selectedTagIds.length > 0 && (
              <button onClick={clearFilter} style={styles.clearBtn}>
                Clear all
              </button>
            )}
          </div>
          <div style={styles.tagList}>
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleToggle(tag.id)}
                style={{
                  ...styles.tagOption,
                  ...(selectedTagIds.includes(tag.id) ? styles.tagOptionSelected : {}),
                }}
              >
                <span 
                  style={{
                    ...styles.tagDot,
                    backgroundColor: tag.color,
                  }}
                />
                <span style={styles.tagName}>{tag.name}</span>
                <span style={styles.taskCount}>{tag.task_count}</span>
                {selectedTagIds.includes(tag.id) && (
                  <span style={styles.checkmark}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {isOpen && (
        <div style={styles.backdrop} onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
  },
  filterBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  filterBtnActive: {
    backgroundColor: '#e8f4f8',
    borderColor: '#3498db',
  },
  badge: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '0.1rem 0.4rem',
    borderRadius: '10px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '0.5rem',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 101,
    minWidth: '220px',
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    borderBottom: '1px solid #eee',
  },
  dropdownTitle: {
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#333',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#e74c3c',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  tagList: {
    maxHeight: '250px',
    overflowY: 'auto',
  },
  tagOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.6rem 0.75rem',
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
  taskCount: {
    color: '#999',
    fontSize: '0.75rem',
  },
  checkmark: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
};
