/// <reference lib="dom" />
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import {
  ToggleSwitch,
  ConfigSection,
} from '../../components/ConfigComponents/ConfigComponents';
import './ConfigPage.css';

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

        <div className="dev-warning">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span><strong>Atenção:</strong> Esta página de configurações ainda está em desenvolvimento. Algumas opções podem não estar disponíveis ou funcionar como esperado.</span>
        </div>

        <div className="config-options-list">

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