// src/components/LocationsManager/LocationsManager.tsx
import './LocationsManager.css';

// Define the type for a single location based on the backend controller
export interface Local {
  id: number;
  name: string;
  description?: string | null;
  code?: string | null;
  type: 'CLASSROOM' | 'LABORATORY' | 'BATHROOM' | 'OFFICE' | 'LIBRARY' | 'CAFETERIA' | 'AUDITORIUM' | 'ENTRANCE' | 'STAIRS' | 'ELEVATOR' | 'PARKING' | 'OTHER';
  x: number;
  y: number;
  z: number;
  floor: number;
  building?: string | null;
  iconUrl?: string | null;
  imageUrl?: string | null;
  accessible: boolean;
  isActive: boolean;
  mapId: number;
  map: {
    id: number;
    name: string;
    imageUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface LocationsManagerProps {
  locations: Local[];
  onDelete: (id: number) => void;
  // onEdit: (id: number) => void;
  // onCreate: () => void;
}

export function LocationsManager({ locations, onDelete }: LocationsManagerProps) {
  return (
    <div className="locations-manager-container">
      <div className="locations-manager-header">
        <h1>Gerenciamento de Locais</h1>
        <button className="create-location-btn">
            <i className="fa-solid fa-plus"></i>
            <span>Adicionar Local</span>
        </button>
      </div>
      
      <p>Aqui você pode visualizar, criar, editar e remover os locais cadastrados no sistema.</p>

      <div className="locations-table-container">
        <table className="locations-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Andar</th>
              <th>Edifício</th>
              <th>Acessível</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {locations.length > 0 ? (
              locations.map(location => (
                <tr key={location.id}>
                  <td>{location.name}</td>
                  <td>{location.type}</td>
                  <td>{location.floor}</td>
                  <td>{location.building || 'N/A'}</td>
                  <td>{location.accessible ? 'Sim' : 'Não'}</td>
                  <td className="actions-cell">
                    <button className="action-btn edit-btn" title="Editar">
                        <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button 
                      className="action-btn delete-btn" 
                      title="Deletar"
                      onClick={() => onDelete(location.id)}
                    >
                        <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-data-cell">Nenhum local encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
