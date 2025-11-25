/// <reference lib="dom" />
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

// --- CORREÇÃO DE AMBIENTE ---
declare const window: any;
declare const localStorage: any;

interface UserPreferences {
  // Navegação
  accessibilityMode: boolean;
  avoidStairs: boolean;
  showAlternativeRoutes: boolean;
}

const defaultPreferences: UserPreferences = {
  accessibilityMode: false,
  avoidStairs: false,
  showAlternativeRoutes: true,
};

export function ConfigPage() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  
  const { mapType, setMapType } = useMap();
  const { mode, setMode } = useMapSettings();

  // CORREÇÃO: Usando o valor 'mapType' direto em vez de função de callback (prev =>)
  // Isso resolve o erro de tipagem do TypeScript
  const handleToggleMapType = () => {
    const newType = mapType === 'cima' ? 'staff' : 'cima';
    setMapType(newType);
  };

  // Carregar preferências salvas
  useEffect(() => {
    const saved = localStorage.getItem('gnomon_preferences');
    if (saved) {
      try {
        const savedPrefs = JSON.parse(saved);
        const validPreferences: Partial<UserPreferences> = {};
        Object.keys(defaultPreferences).forEach(key => {
          if (savedPrefs.hasOwnProperty(key)) {
            validPreferences[key as keyof UserPreferences] = savedPrefs[key];
          }
        });
        setPreferences({ ...defaultPreferences, ...validPreferences });
      } catch (error) {
        console.error("Failed to parse preferences from localStorage", error);
        setPreferences(defaultPreferences);
      }
    }
  }, []);

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    localStorage.setItem('gnomon_preferences', JSON.stringify(newPreferences));
  };

  return (
    <div className="config-page-container">
      <Header />
      
      <main className="config-main-content">
        <button onClick={() => navigate('/mapa')} className="back-to-map-btn">
          <i className="fa-solid fa-arrow-left"></i> Voltar para o Mapa
        </button>

        <div className="config-header">
          <h1>Configurações</h1>
          <p>Personalize sua experiência de navegação no campus.</p>
        </div>

        <div className="config-options-list">

          {/* SEÇÃO: VISUALIZAÇÃO DO MAPA */}
          <ConfigSection 
            title="Visualização do Mapa" 
            description="Escolha o modo de visualização e o tipo de planta"
          >
            {/* O RadioGroup para 2D/3D é mantido no código, mas escondido da UI com CSS */}
            <div style={{ display: 'none' }}>
              <RadioGroup
                label="Modo de Visualização"
                value={mode}
                onChange={(value) => setMode(value as '2d' | '3d')}
                options={[
                  { value: '2d', label: '2D' },
                  { value: '3d', label: '3D' },
                ]}
              />
            </div>
            
            <div className="map-type-selector">
              <p>Tipo de planta: <strong>{mapType === 'cima' ? 'Planta Baixa' : 'Detalhado'}</strong></p>
              <button 
                className="btn-secondary"
                onClick={handleToggleMapType}
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
        </div>
      </main>
    </div>
  );
}