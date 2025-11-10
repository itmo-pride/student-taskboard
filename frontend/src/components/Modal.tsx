import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, width = 800, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div style={styles.backdrop} onClick={onClose}>
      <div
        style={{ ...styles.dialog, width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">×</button>
        </div>
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'grid',
    placeItems: 'center',
    padding: '2rem',
    zIndex: 1000,
  },
  dialog: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    maxHeight: '85vh',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 1,
  },
  body: {
    padding: '1rem 1.25rem',
  },
  closeBtn: {
    border: 'none',
    background: 'transparent',
    fontSize: '1.5rem',
    lineHeight: 1,
    cursor: 'pointer',
  },
};
