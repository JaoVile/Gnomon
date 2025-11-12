import { useEffect, useState } from 'react';
import './GpsMarker.css';

type Props = {
  x: number;
  y: number;
  scale: number;
  animated?: boolean;
};

export default function GpsMarker({ x, y, scale, animated = true }: Props) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!animated) return;
    
    let frame = 0;
    const animate = () => {
      frame++;
      setPulse(Math.sin(frame * 0.1) * 0.5 + 0.5);
      requestAnimationFrame(animate);
    };
    
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [animated]);

  const size = 20 / scale;
  const ringSize = (20 + pulse * 10) / scale;

  return (
    <g className="gps-marker">
      {/* Anel pulsante externo */}
      <circle
        cx={x}
        cy={y}
        r={ringSize}
        fill="none"
        stroke="#0A84FF"
        strokeWidth={2 / scale}
        opacity={0.3 * (1 - pulse)}
      />
      
      {/* Anel médio */}
      <circle
        cx={x}
        cy={y}
        r={size * 1.5}
        fill="rgba(10, 132, 255, 0.2)"
        stroke="#0A84FF"
        strokeWidth={1.5 / scale}
      />
      
      {/* Ponto central */}
      <circle
        cx={x}
        cy={y}
        r={size * 0.6}
        fill="#0A84FF"
        stroke="#FFFFFF"
        strokeWidth={2 / scale}
      />
      
      {/* Sombra */}
      <circle
        cx={x}
        cy={y + 2 / scale}
        r={size * 0.6}
        fill="rgba(0, 0, 0, 0.3)"
        filter="blur(2px)"
      />
    </g>
  );
}