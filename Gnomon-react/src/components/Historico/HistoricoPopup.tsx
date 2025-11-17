import './HistoricoPopup.css';

// Define a estrutura de uma entrada do histórico
export interface HistoryEntry {
  originId: string;
  destinationId: string;
  originLabel: string;
  destinationLabel: string;
  timestamp: string;
}

interface HistoricoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onSelectRoute: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
}

export function HistoricoPopup({ isOpen, onClose, history, onSelectRoute, onClearHistory }: HistoricoPopupProps) {
  if (!isOpen) {
    return null;
  }

  // Inverte o histórico para mostrar os mais recentes primeiro
  const reversedHistory = [...history].reverse();

  return (
    <div className="historico-backdrop" onClick={onClose}>
      <div className="historico-popup" onClick={(e) => e.stopPropagation()}>
        <div className="historico-header">
          <h2><i className="fa-solid fa-clock-rotate-left"></i> Histórico de Rotas</h2>
          <button onClick={onClose} className="close-btn" aria-label="Fechar">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="historico-list">
          {reversedHistory.length === 0 ? (
            <div className="empty-history">
              <i className="fa-solid fa-map-signs"></i>
              <p>Você ainda não traçou nenhuma rota.</p>
              <span>As rotas que você criar aparecerão aqui.</span>
            </div>
          ) : (
            reversedHistory.map((entry, index) => (
              <div key={index} className="history-item" onClick={() => onSelectRoute(entry)} title={`Recalcular rota de ${entry.originLabel} para ${entry.destinationLabel}`}>
                <div className="route-info">
                  <span className="route-path">
                    De: <strong>{entry.originLabel}</strong><br/>
                    Para: <strong>{entry.destinationLabel}</strong>
                  </span>
                  <span className="route-timestamp">
                    {new Date(entry.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
                <i className="fa-solid fa-arrow-right-to-bracket"></i>
              </div>
            ))
          )}
        </div>
        {history.length > 0 && (
            <div className="historico-footer">
                <button onClick={onClearHistory} className="clear-history-btn">
                    <i className="fa-solid fa-trash-can"></i> Limpar Histórico
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
