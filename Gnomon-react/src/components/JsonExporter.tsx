import { useState } from 'react';

type Props = {
  title: string;
  data: any[];
  formatter?: (item: any) => any;
};

// Simple button to copy text to clipboard
function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<'idle' | 'copied'>('idle');

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setStatus('copied');
      const timer = setTimeout(() => setStatus('idle'), 2000);
      return () => clearTimeout(timer);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        background: status === 'copied' ? '#34c759' : '#007aff',
        color: 'white',
        border: 'none',
        borderRadius: 5,
        padding: '4px 8px',
        fontSize: '11px',
        cursor: 'pointer',
        minWidth: '60px',
        transition: 'background-color 0.2s ease',
      }}
    >
      {status === 'copied' ? 'Copiado!' : 'Copiar'}
    </button>
  );
}


export default function JsonExporter({ title, data, formatter }: Props) {
  if (!data || data.length === 0) {
    return null;
  }

  const formattedData = formatter ? data.map(formatter) : data;
  const jsonString = JSON.stringify(formattedData, null, 2);

  return (
    <div style={{
      background: 'rgba(28, 28, 30, 0.9)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
      padding: '8px 12px',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxHeight: '200px',
      fontSize: '12px',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <strong style={{ fontWeight: 600 }}>{title}</strong>
        <CopyButton text={jsonString} />
      </div>
      <pre style={{
        margin: 0,
        padding: '8px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 4,
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        flexGrow: 1,
      }}>
        {jsonString}
      </pre>
    </div>
  );
}
