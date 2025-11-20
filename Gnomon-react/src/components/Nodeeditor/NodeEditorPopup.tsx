// src/components/NodeEditorPopup.tsx
import { useState, useEffect } from 'react';
import './NodeEditorPopup.css';
import type { Poi, MapNode } from '../../hooks/useMapData';

export type EditableNode = Partial<Poi & MapNode>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditableNode) => void;
  initialData?: EditableNode | null;
  nodeType: 'poi' | 'entrance' | 'connection';
};

export function NodeEditorPopup({ isOpen, onClose, onSave, initialData, nodeType }: Props) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    setLabel(initialData?.label || '');
    setType(initialData?.type || nodeType);
    setCategory(initialData?.category || '');
  }, [initialData, nodeType]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      ...initialData,
      label,
      type,
      category,
    });
    onClose();
  };

  const getTitle = () => {
    switch (nodeType) {
      case 'poi': return 'Adicionar Ponto de Interesse';
      case 'entrance': return 'Adicionar Entrada';
      case 'connection': return 'Adicionar Ponto de Conexão';
      default: return 'Editar Ponto';
    }
  }

  return (
    <div className="node-editor-backdrop" onClick={onClose}>
      <div className="node-editor-popup" onClick={(e) => e.stopPropagation()}>
        <h3>{getTitle()}</h3>
        
        {nodeType !== 'connection' && (
          <div className="form-group">
            <label htmlFor="node-label">Nome / Rótulo</label>
            <input
              id="node-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Biblioteca, Entrada Principal"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="node-type">Tipo</label>
          <input
            id="node-type"
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Ex: sala, banheiro, entrada"
          />
        </div>

        {nodeType === 'poi' && (
            <div className="form-group">
                <label htmlFor="node-category">Categoria</label>
                <input
                id="node-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Serviços, Acadêmico"
                />
            </div>
        )}

        <div className="popup-buttons">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} className="btn-primary">Salvar</button>
        </div>
      </div>
    </div>
  );
}
