import React from 'react';
import './FavoritosPopup.css';

// Estrutura de um item favorito
export interface FavoriteEntry {
  id: string; // ID único para cada favorito
  originId: string;
  destinationId: string;
  originLabel: string;
  destinationLabel: string;
  timestamp: string;
}

interface FavoritosPopupProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteEntry[];
  onSelectFavorite: (entry: FavoriteEntry) => void;
  onClearFavorites: () => void;
  onRemoveFavorite: (id: string) => void;
}

export function FavoritosPopup({ 
    isOpen, 
    onClose, 
    favorites, 
    onSelectFavorite, 
    onClearFavorites,
    onRemoveFavorite
}: FavoritosPopupProps) {
  if (!isOpen) {
    return null;
  }

  // Inverte para mostrar os mais recentes primeiro
  const reversedFavorites = [...favorites].reverse();

  return (
    <div className="favoritos-backdrop" onClick={onClose}>
      <div className="favoritos-popup" onClick={(e) => e.stopPropagation()}>
        <div className="favoritos-header">
          <h2><i className="fa-solid fa-star"></i> Rotas Favoritas</h2>
          <button onClick={onClose} className="close-btn" aria-label="Fechar">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="favoritos-list">
          {reversedFavorites.length === 0 ? (
            <div className="empty-favorites">
              <i className="fa-regular fa-star"></i>
              <p>Nenhuma rota favorita.</p>
              <span>As rotas que você favoritar aparecerão aqui.</span>
            </div>
          ) : (
            reversedFavorites.map((fav) => (
              <div key={fav.id} className="favorite-item">
                <div className="route-info" onClick={() => onSelectFavorite(fav)} style={{ flex: 1, cursor: 'pointer' }}>
                  <span className="route-path">
                    De: <strong>{fav.originLabel}</strong><br/>
                    Para: <strong>{fav.destinationLabel}</strong>
                  </span>
                  <span className="route-timestamp">
                    Salvo em: {new Date(fav.timestamp).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <button 
                    className="remove-btn" 
                    title="Remover favorito"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFavorite(fav.id);
                    }}
                >
                    <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ))
          )}
        </div>
        {favorites.length > 0 && (
            <div className="favoritos-footer">
                <button 
                    onClick={onClearFavorites} 
                    className="clear-favorites-btn"
                    disabled={favorites.length === 0}
                >
                    <i className="fa-solid fa-trash"></i> Limpar Tudo
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
