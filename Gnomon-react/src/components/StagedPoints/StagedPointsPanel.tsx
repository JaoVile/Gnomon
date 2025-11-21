import './StagedPointsPanel.css';

type PointType = 'add_poi' | 'add_entrance' | 'add_connection' | 'none';

export type StagedPoint = {
  x: number;
  y: number;
  type: PointType;
};

type Props = {
  isVisible: boolean;
  points: StagedPoint[];
  onDeletePoint: (index: number) => void;
  onClearAll: () => void;
  onClose: () => void;
};

function getPointTypeDisplayName(type: PointType): string {
    switch (type) {
        case 'add_poi': return 'referencia';
        case 'add_entrance': return 'entrada';
        case 'add_connection': return 'conexao';
        default: return 'desconhecido';
    }
}

export function StagedPointsPanel({ isVisible, points, onDeletePoint, onClearAll, onClose }: Props) {
  return (
    <div className={`staged-points-panel ${isVisible ? 'visible' : ''}`}>
      <header className="staged-points-header">
        <h3>Pontos Marcados</h3>
        <button onClick={onClose} className="close-panel-btn" title="Fechar painel">
          <i className="fa-solid fa-times"></i>
        </button>
      </header>
      
      {points.length > 0 ? (
        <ul className="staged-points-list">
          {points.map((point, index) => {
            const displayName = getPointTypeDisplayName(point.type);
            return (
              <li key={index} className="staged-point-item">
                <div className="point-info">
                  <span className={`point-type-badge ${displayName}`}>
                    {displayName}
                  </span>
                  <span className="point-coords">
                    {`"x": ${point.x}, "y": ${point.y}`}
                  </span>
                </div>
                <button onClick={() => onDeletePoint(index)} className="delete-point-btn" title="Apagar ponto">
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="no-points-message">
          <p>Nenhum ponto marcado.</p>
          <p>Selecione uma ferramenta e clique no mapa para adicionar pontos.</p>
        </div>
      )}

      {points.length > 0 && (
        <footer className="staged-points-footer">
          <button onClick={onClearAll} className="clear-all-btn">
            <i className="fa-solid fa-trash-can"></i> Limpar Tudo
          </button>
        </footer>
      )}
    </div>
  );
}
