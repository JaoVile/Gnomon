import React from 'react';

export type PointCategory = 'ENTRY' | 'REF' | 'CONNECTION';

export type CapturedPoint = {
  x: number;
  y: number;
  kind: PointCategory;
};

type Props = {
  points: CapturedPoint[];
  onClear: () => void;
};

export default function PointsHistory({ points, onClear }: Props) {
  const copyToClipboard = () => {
    const pointsByCategory = points.reduce((acc, point) => {
      const category = point.kind.toLowerCase() + 's';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ x: Number(point.x.toFixed(2)), y: Number(point.y.toFixed(2)) });
      return acc;
    }, {} as Record<string, { x: number; y: number }[]>);

    const jsonString = JSON.stringify(pointsByCategory, null, 2);
    navigator.clipboard.writeText(jsonString);
  };

  if (points.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      width: '300px',
      maxHeight: '400px',
      overflowY: 'auto',
      background: 'rgba(28, 28, 30, 0.9)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      color: 'white',
      zIndex: 10,
      padding: '10px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }}>Pontos Capturados</h4>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <button onClick={copyToClipboard} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#0A84FF', color: 'white' }}>Copiar JSON</button>
        <button onClick={onClear} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#b32b2b', color: 'white' }}>Limpar Tudo</button>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '12px' }}>
        {points.map((p, i) => (
          <li key={i} style={{ marginBottom: '5px', padding: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
            <strong>{p.kind}:</strong> x: {p.x.toFixed(1)}, y: {p.y.toFixed(1)}
          </li>
        ))}
      </ul>
    </div>
  );
}
