// src/components/RouteInstructions.tsx
import React from 'react';
import './RouteInstructions.css'; // ✅ ADICIONE ESTA LINHA
import type { TurnInstruction } from './Map2D';

type Props = {
  instructions?: TurnInstruction[];
  onClose: () => void;
};

function resolveIcon(step: TurnInstruction): string {
  if (step.icon && step.icon.startsWith('fa-')) {
    return `fa-solid ${step.icon}`;
  }

  const t = (step.text ?? '').toLowerCase();

  if (t.includes('iniciar') || t.includes('comece') || t.includes('partida')) 
    return 'fa-solid fa-location-dot';
  if (t.includes('destino') || t.includes('chegou')) 
    return 'fa-solid fa-flag-checkered';
  if (t.includes('direita')) 
    return 'fa-solid fa-arrow-right';
  if (t.includes('esquerda')) 
    return 'fa-solid fa-arrow-left';
  if (t.includes('retorne') || t.includes('180')) 
    return 'fa-solid fa-rotate-left';

  return 'fa-solid fa-arrow-up';
}

function formatDistance(px?: number) {
  if (!Number.isFinite(px)) return '';
  const meters = Math.round((px as number) / 5);
  if (meters <= 1) return '';
  return `aprox. ${meters} m`;
}

export default function RouteInstructions({ instructions = [], onClose }: Props) {
  if (!Array.isArray(instructions) || instructions.length === 0) return null;

  return (
    <div className="route-instructions-panel">
      <div className="panel-header">
        <h4>Sua Rota</h4>
        <button 
          onClick={onClose} 
          className="close-button" 
          title="Fechar Rota"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <ul className="instructions-list">
        {instructions.map((step, index) => {
          const iconClass = resolveIcon(step);
          const text = step?.text ?? '';
          const distanceLabel = formatDistance(step?.distance);

          return (
            <li key={index} className="instruction-item">
              <div className="instruction-icon">
                <i className={iconClass}></i>
              </div>
              <div className="instruction-text">
                <span>{text}</span>
                {distanceLabel && (
                  <small className="distance-label">{distanceLabel}</small>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}