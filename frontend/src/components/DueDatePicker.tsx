import { useState, useEffect } from 'react';

interface Props {
  value: string | null | undefined;
  onChange: (newDate: string | null) => Promise<void>;
  disabled?: boolean;
}

export default function DueDatePicker({ value, onChange, disabled }: Props) {
  const [localValue, setLocalValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocalValue(value ? value.split('T')[0] : '');
  }, [value]);

  const handleBlur = async () => {
    const currentValue = value ? value.split('T')[0] : '';
    
    if (localValue === currentValue) return;
    
    if (!localValue) {

      if (value) {
        setIsLoading(true);
        try {
          await onChange(null);
        } finally {
          setIsLoading(false);
        }
      }
      return;
    }

    const date = new Date(localValue);
    if (isNaN(date.getTime())) {

      setLocalValue(currentValue);
      return;
    }

    setIsLoading(true);
    try {
      await onChange(localValue);
    } catch (err) {

      setLocalValue(currentValue);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value ? value.split('T')[0] : '');
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleClear = async () => {
    setIsLoading(true);
    try {
      await onChange(null);
      setLocalValue('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <input
        type="date"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          ...styles.input,
          opacity: isLoading ? 0.6 : 1,
        }}
        disabled={disabled || isLoading}
      />
      {(localValue || value) && (
        <button
          onClick={handleClear}
          style={styles.clearBtn}
          disabled={isLoading}
          title="Remove deadline"
          type="button"
        >
          ✕
        </button>
      )}
      {isLoading && <span style={styles.loader}>⏳</span>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  input: {
    padding: '0.3rem 0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.8rem',
    maxWidth: '130px',
  },
  clearBtn: {
    width: '22px',
    height: '22px',
    border: 'none',
    backgroundColor: '#e74c3c',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.7rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  loader: {
    fontSize: '0.8rem',
  },
};
