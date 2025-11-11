// src/components/RouteInstructions.tsx
import React from 'react';
import type { TurnInstruction } from './Map2D';

type Props = {
  instructions: TurnInstruction[];
  onClose: () => void;
};

function getIconForInstruction(instruction: string): string {
  const lower = instruction.toLowerCase();
  if (lower.includes('comece') || lower.includes('partida')) return 'fa-solid fa-flag';
  if (lower.includes('destino') || lower.includes('chegou')) return 'fa-solid fa-flag-checkered';
  if (lower.includes('direita')) return 'fa-solid fa-arrow-turn-up fa-rotate-90';
  if (lower.includes('esquerda')) return 'fa-solid fa-arrow-turn-up fa-flip-horizontal';
  return 'fa-solid fa-arrow-up'; // Siga em frente
}

export default function RouteInstructions({ instructions, onClose }: Props) {
  if (!instructions || instructions.length === 0) {
    return null;
  }

  return (
    <div className="route-instructions-panel">
      <div className="panel-header">
        <h4>Sua Rota</h4>
        <button onClick={onClose} className="close-button" title="Fechar Rota">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <ul className="instructions-list">
        {instructions.map((item, index) => (
          <li key={index} className="instruction-item">
            <div className="instruction-icon">
              <i className={getIconForInstruction(item.instruction)}></i>
            </div>
            <div className="instruction-text">
              <span>{item.instruction}</span>
              {item.distance > 1 && (
                <small className="distance-label">
                  {/* Converte a distância (pixels) para metros (ajuste o fator se necessário) */}
                  aprox. {Math.round(item.distance / 5)} m
                </small>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}