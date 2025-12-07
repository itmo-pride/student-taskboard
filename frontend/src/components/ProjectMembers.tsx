import { useState, useEffect } from 'react';
import { projectsAPI, usersAPI } from '../api/client';
import { ProjectMember, User, ProjectRole } from '../types';

interface Props {
  projectId: string;
  currentUserRole: ProjectRole;
  onOwnershipTransferred?: () => void;
}

export default function ProjectMembers({ projectId, currentUserRole, onOwnershipTransferred }: Props) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState<ProjectMember | null>(null);

  const isOwner = currentUserRole === 'owner';
  const isAdmin = currentUserRole === 'admin';
  const canManageMembers = isOwner;

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const loadMembers = async () => {
    try {
      const response = await projectsAPI.getMembers(projectId);
      setMembers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await usersAPI.search(searchQuery, projectId);
        setSearchResults(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, projectId]);

  const handleAddMember = async (userId: string) => {
    try {
      await projectsAPI.addMember(projectId, userId);
      setSearchQuery('');
      setSearchResults([]);
      setShowAddForm(false);
      loadMembers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from the project?`)) return;

    try {
      await projectsAPI.removeMember(projectId, userId);
      loadMembers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      await projectsAPI.updateMemberRole(projectId, userId, newRole);
      loadMembers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTarget) return;
    
    if (!confirm(`Are you sure you want to transfer ownership to ${transferTarget.user_name}? You will become an admin.`)) {
      return;
    }

    try {
      await projectsAPI.transferOwnership(projectId, transferTarget.user_id);
      setShowTransferModal(false);
      setTransferTarget(null);
      loadMembers();
      onOwnershipTransferred?.();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to transfer ownership');
    }
  };

  const getRoleBadgeStyle = (role: ProjectRole) => {
    switch (role) {
      case 'owner':
        return { backgroundColor: '#f39c12', icon: '👑' };
      case 'admin':
        return { backgroundColor: '#9b59b6', icon: '⚡' };
      default:
        return { backgroundColor: '#95a5a6', icon: '👤' };
    }
  };

  if (loading) return <div style={styles.loading}>Loading members...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          👥 Team Members ({members.length})
        </h3>
        {canManageMembers && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            style={styles.addButton}
          >
            {showAddForm ? 'Cancel' : '+ Add Member'}
          </button>
        )}
      </div>

      <div style={styles.legend}>
        <span style={styles.legendItem}>
          <span style={{...styles.legendBadge, backgroundColor: '#f39c12'}}>👑 Owner</span>
        </span>
        <span style={styles.legendItem}>
          <span style={{...styles.legendBadge, backgroundColor: '#9b59b6'}}>⚡ Admin</span>
        </span>
        <span style={styles.legendItem}>
          <span style={{...styles.legendBadge, backgroundColor: '#95a5a6'}}>👤 Member</span>
        </span>
      </div>

      {showAddForm && (
        <div style={styles.addForm}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            style={styles.searchInput}
            autoFocus
          />
          
          {searching && <div style={styles.searching}>Searching...</div>}
          
          {searchResults.length > 0 && (
            <div style={styles.searchResults}>
              {searchResults.map((user) => (
                <div key={user.id} style={styles.searchResultItem}>
                  <div style={styles.userInfo}>
                    <span style={styles.userName}>{user.name}</span>
                    <span style={styles.userEmail}>{user.email}</span>
                  </div>
                  <button
                    onClick={() => handleAddMember(user.id)}
                    style={styles.inviteButton}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <div style={styles.noResults}>No users found</div>
          )}
        </div>
      )}

      <div style={styles.membersList}>
        {members.map((member) => {
          const badgeStyle = getRoleBadgeStyle(member.role);
          
          return (
            <div key={member.id} style={styles.memberCard}>
              <div style={styles.avatar}>
                {member.user_name.charAt(0).toUpperCase()}
              </div>
              
              <div style={styles.memberInfo}>
                <div style={styles.memberName}>
                  {member.user_name}
                  <span style={{...styles.roleBadge, backgroundColor: badgeStyle.backgroundColor}}>
                    {badgeStyle.icon} {member.role}
                  </span>
                </div>
                <div style={styles.memberEmail}>{member.user_email}</div>
                <div style={styles.joinedAt}>
                  Joined {new Date(member.joined_at).toLocaleDateString()}
                </div>
              </div>

              {isOwner && member.role !== 'owner' && (
                <div style={styles.memberActions}>
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user_id, e.target.value as 'admin' | 'member')}
                    style={styles.roleSelect}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  <button
                    onClick={() => {
                      setTransferTarget(member);
                      setShowTransferModal(true);
                    }}
                    style={styles.transferButton}
                    title="Transfer ownership"
                  >
                    👑
                  </button>
                  
                  <button
                    onClick={() => handleRemoveMember(member.user_id, member.user_name)}
                    style={styles.removeButton}
                    title="Remove from project"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showTransferModal && transferTarget && (
        <div style={styles.modalBackdrop} onClick={() => setShowTransferModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>⚠️ Transfer Ownership</h3>
            <p style={styles.modalText}>
              You are about to transfer ownership of this project to <strong>{transferTarget.user_name}</strong>.
            </p>
            <p style={styles.modalWarning}>
              This action will make you an admin. Only the new owner can transfer ownership back.
            </p>
            <div style={styles.modalActions}>
              <button 
                onClick={() => setShowTransferModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={handleTransferOwnership}
                style={styles.confirmButton}
              >
                Transfer Ownership
              </button>
            </div>
          </div>
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
    marginBottom: '0.75rem',
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#2c3e50',
  },
  legend: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  legendItem: {
    fontSize: '0.75rem',
  },
  legendBadge: {
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    color: 'white',
    fontSize: '0.7rem',
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
  addForm: {
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #3498db',
    borderRadius: '6px',
    fontSize: '1rem',
    outline: 'none',
  },
  searching: {
    padding: '0.5rem',
    color: '#666',
    fontSize: '0.9rem',
  },
  searchResults: {
    marginTop: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  searchResultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    borderBottom: '1px solid #eee',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontWeight: 500,
  },
  userEmail: {
    fontSize: '0.85rem',
    color: '#666',
  },
  inviteButton: {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  noResults: {
    padding: '1rem',
    textAlign: 'center',
    color: '#999',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  memberCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    gap: '1rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  roleBadge: {
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    color: 'white',
    textTransform: 'capitalize',
  },
  memberEmail: {
    fontSize: '0.85rem',
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  joinedAt: {
    fontSize: '0.75rem',
    color: '#999',
  },
  memberActions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexShrink: 0,
  },
  roleSelect: {
    padding: '0.3rem 0.5rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  transferButton: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f39c12',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#e74c3c',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  modalTitle: {
    margin: '0 0 1rem 0',
    color: '#e67e22',
  },
  modalText: {
    color: '#333',
    marginBottom: '0.5rem',
  },
  modalWarning: {
    color: '#e74c3c',
    fontSize: '0.9rem',
    backgroundColor: '#ffeaea',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  modalActions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  confirmButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};
