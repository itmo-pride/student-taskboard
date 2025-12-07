import 'katex/dist/katex.min.css';
import katex from 'katex';

type Props = {
  math: string;
  block?: boolean;  
  className?: string;
};

export default function LatexRenderer({ math, block = false, className }: Props) {
  if (!math || !math.trim()) {
    return null;
  }

  try {
    const html = katex.renderToString(math, {
      throwOnError: false,      
      displayMode: block,       
      errorColor: '#e74c3c',    
      strict: false,            
    });

    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
        style={block ? { display: 'block', textAlign: 'center', margin: '1rem 0' } : undefined}
      />
    );
  } catch (error) {
    
    return (
      <code style={styles.fallback}>
        {math}
      </code>
    );
  }
}

const styles = {
  fallback: {
    backgroundColor: '#f8f9fa',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontFamily: 'monospace',
    color: '#e74c3c',
  } as React.CSSProperties,
};
