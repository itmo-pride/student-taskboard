import { Tag } from '../types';

interface Props {
  tag: Tag;
  onRemove?: () => void;
  size?: 'small' | 'medium';
}

export default function TagBadge({ tag, onRemove, size = 'small' }: Props) {
  const isLight = isLightColor(tag.color);
  
  return (
    <span 
      style={{
        ...styles.badge,
        ...(size === 'medium' ? styles.badgeMedium : {}),
        backgroundColor: tag.color,
        color: isLight ? '#333' : '#fff',
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            ...styles.removeBtn,
            color: isLight ? '#666' : 'rgba(255,255,255,0.8)',
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

const styles: Record<string, React.CSSProperties> = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.15rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  badgeMedium: {
    padding: '0.25rem 0.6rem',
    fontSize: '0.8rem',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    marginLeft: '0.15rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    lineHeight: 1,
    opacity: 0.7,
  },
};
