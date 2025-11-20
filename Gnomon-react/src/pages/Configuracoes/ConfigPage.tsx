import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import {
  ToggleSwitch,
  ConfigSection,
  RadioGroup,
} from '../../components/ConfigComponents/ConfigComponents';
import './ConfigPage.css';
import { useMap } from '../../contexts/MapContext';
import { useMapSettings } from '../../contexts/MapSettingsContext';

interface UserPreferences {
  // Navegação
  accessibilityMode: boolean;
  avoidStairs: boolean;
  showAlternativeRoutes: boolean;
  
  // Privacidade
  saveHistory: boolean;
}

const defaultPreferences: UserPreferences = {
  accessibilityMode: false,
  avoidStairs: false,
  showAlternativeRoutes: true,
  
  saveHistory: true,
};

export function ConfigPage() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { mapType, toggleMapType } = useMap();
  const { mode, setMode } = useMapSettings();

  // Carregar preferências salvas
  useEffect(() => {
    const saved = localStorage.getItem('gnomon_preferences');
    if (saved) {
      setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
    }
  }, []);

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('gnomon_preferences', JSON.stringify(preferences));
      
      // Se tiver backend, enviar para API
      // await api.post('/user/preferences', preferences);
      
      setHasChanges(false);
      
      // Mostrar toast de sucesso
      showToast('Configurações salvas com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao salvar configurações', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar as configurações padrão?')) {
      setPreferences(defaultPreferences);
      setHasChanges(true);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    // Implementar com seu componente Toast
    console.log(message, type);
  };

  return (
    <div className="config-page-container">
      <Header />
      
      <main className="config-main-content">
        <button onClick={() => navigate('/mapa')} className="back-to-map-btn">
          <i className="fa-solid fa-arrow-left"></i> Voltar para o Mapa
        </button>

        <div className="config-header">
          <h1> Configurações</h1>
          <p>Personalize sua experiência de navegação no campus.</p>
        </div>

        <div className="config-options-list">

          {/* SEÇÃO: VISUALIZAÇÃO DO MAPA */}
          <ConfigSection 
            title="Visualização do Mapa" 
            description="Escolha o modo de visualização e o tipo de planta"
          >
            <RadioGroup
              label="Modo de Visualização"
              value={mode}
              onChange={(value) => setMode(value as '2d' | '3d')}
              options={[
                { value: '2d', label: '2D' },
                { value: '3d', label: '3D' },
              ]}
            />
            <div className="map-type-selector">
              <p>Tipo de planta: <strong>{mapType === 'cima' ? 'Planta Baixa' : 'Detalhado'}</strong></p>
              <button 
                className="btn-secondary"
                onClick={toggleMapType}
              >
                Alterar para {mapType === 'cima' ? 'Detalhado' : 'Planta Baixa'}
              </button>
            </div>
          </ConfigSection>
          
          {/* SEÇÃO: NAVEGAÇÃO */}
          <ConfigSection 
            title="Navegação e Rotas" 
            description="Configure como as rotas são calculadas"
          >
            <ToggleSwitch
              label="Modo Acessibilidade"
              description="Prioriza rotas acessíveis para cadeirantes"
              checked={preferences.accessibilityMode}
              onChange={(checked) => updatePreference('accessibilityMode', checked)}
              icon="♿"
            />

            <ToggleSwitch
              label="Evitar Escadas"
              description="Evita rotas com escadas sempre que possível"
              checked={preferences.avoidStairs}
              onChange={(checked) => updatePreference('avoidStairs', checked)}
              disabled={preferences.accessibilityMode}
            />

            <ToggleSwitch
              label="Mostrar Rotas Alternativas"
              description="Exibe até 3 rotas alternativas ao destino"
              checked={preferences.showAlternativeRoutes}
              onChange={(checked) => updatePreference('showAlternativeRoutes', checked)}
            />
          </ConfigSection>

          {/* SEÇÃO: PRIVACIDADE */}
          <ConfigSection 
            title="Privacidade e Dados" 
            description="Controle seus dados e privacidade"
          >
            <ToggleSwitch
              label="Salvar Histórico"
              description="Salva suas rotas e buscas recentes"
              checked={preferences.saveHistory}
              onChange={(checked) => updatePreference('saveHistory', checked)}
              icon="📜"
            />

            <div className="config-danger-zone">
              <button 
                className="btn-danger-outline"
                onClick={() => {
                  if (confirm('Isso irá limpar todo o histórico de buscas e rotas. Continuar?')) {
                    localStorage.removeItem('gnomon_history');
                    showToast('Histórico limpo com sucesso', 'success');
                  }
                }}
              >
                🗑️ Limpar Histórico
              </button>
              
              <button 
                className="btn-danger-outline"
                onClick={() => {
                  if (confirm('Isso irá excluir TODOS os seus dados locais. Continuar?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
              >
                ⚠️ Limpar Todos os Dados
              </button>
            </div>
          </ConfigSection>

        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="config-actions">
          <button 
            className="btn-secondary"
            onClick={handleReset}
            disabled={isSaving}
          >
            🔄 Restaurar Padrões
          </button>
          
          <button 
            className="btn-primary"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? '💾 Salvando...' : '💾 Salvar Alterações'}
          </button>
        </div>

        {hasChanges && (
          <div className="config-unsaved-warning">
            ⚠️ Você tem alterações não salvas
          </div>
        )}
      </main>
    </div>
  );
}