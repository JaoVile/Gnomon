import { useState } from 'react';

type Props = {
  data: any;
};

export default function JsonExporter({ data }: Props) {
  const [copySuccess, setCopySuccess] = useState('');

  const copyToClipboard = async () => {
    const jsonString = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopySuccess('Copiado!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      setCopySuccess('Falhou!');
    }
  };

  return (
    <div className="admin-panel" style={{ position: 'absolute', right: '10px', top: '130px', width: '300px', zIndex: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong>Exportar Grafo (JSON)</strong>
        <button onClick={copyToClipboard} style={{ padding: '4px 8px' }}>
          {copySuccess || 'Copiar'}
        </button>
      </div>
      <pre
        style={{
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid var(--border-color, #2c2c2e)',
          borderRadius: '6px',
          padding: '8px',
          maxHeight: '300px',
          overflowY: 'auto',
          fontSize: '11px',
          color: '#fff',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}