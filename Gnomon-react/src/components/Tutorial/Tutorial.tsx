import React, { useState } from 'react';
import './Tutorial.css';
import gnomonLogo from '/Gnomon_Sem_Nome_Icon.png'; // Importando o logo

interface TutorialProps {
  onClose: (dontShowAgain: boolean) => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleClose = () => {
    onClose(dontShowAgain);
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <img src={gnomonLogo} alt="Gnomon Logo" className="tutorial-logo" />
            <h2>Bem-vindo ao Gnomon!</h2>
            <p>Este é um aplicativo em <strong>versão beta</strong> e está em contínuo desenvolvimento. Sua ajuda é fundamental para aprimorarmos sua experiência.</p>
          </>
        );
      case 2:
        return (
          <>
            <h2>Como Navegar</h2>
            <p>Siga estes passos para encontrar seu caminho no campus de forma fácil e rápida.</p>
            <div className="tutorial-features-grid step2">
              {/* Card 1 */}
              <div className="tutorial-feature-card">
                <div className="feature-card-icon-group">
                  <i className="feature-card-icon entry-point fa-solid fa-location-dot"></i>
                  <i className="feature-card-icon warning-point fa-solid fa-location-dot"></i>
                </div>
                <div className="feature-card-label">1. Explore os pins vermelhos (entradas) e amarelos (locais).</div>
              </div>
              {/* Card 2 */}
              <div className="tutorial-feature-card">
                <div className="feature-card-icon-group">
                  <div className="mini-popup-button"><i className="fa-solid fa-location-dot"></i> Estou aqui</div>
                  <div className="mini-popup-button primary"><i className="fa-solid fa-route"></i> Ir para cá</div>
                </div>
                <div className="feature-card-label">2. Clique neles para definir sua origem ou destino.</div>
              </div>
              {/* Card 3 */}
              <div className="tutorial-feature-card">
                <i className="feature-card-icon destination-point fa-solid fa-location-dot"></i>
                <div className="feature-card-label">3. Sua localização foi marcada. Agora, escolha um destino.</div>
              </div>
              {/* Card 4 */}
              <div className="tutorial-feature-card">
                <div className="route-animation-container-v2">
                  <i className="feature-card-icon destination-point fa-solid fa-location-dot"></i>
                  <svg className="animated-route-svg" viewBox="0 0 100 40">
                    <path className="animated-route-path" d="M10 20 C 40 0, 60 40, 90 20" />
                  </svg>
                  <i className="feature-card-icon final-destination-point fa-solid fa-location-dot"></i>
                </div>
                <div className="feature-card-label">4. Pronto! Siga o caminho traçado para você.</div>
              </div>
            </div>
          </>
        );
      case 3:
        const exampleInitialItems = [
          { type: 'icon', value: 'fa-location-dot', label: 'Ponto de Entrada' },
          { type: 'icon', value: 'fa-map-pin', label: 'Ponto de Referência' },
        ];

        const exampleLocationItems = [
          { type: 'color', value: '#FFB3BA', label: 'Auditório' },
          { type: 'color', value: '#00FFFF', label: 'Laboratórios' },
          { type: 'color', value: '#f0e68dff', label: 'Salas' },
        ];

        return (
          <>
            <h2>Passo 3: Explore e Navegue</h2>
            <div className="tutorial-features-grid step3">

              {/* Card 1: Rota Compacta */}
              <div className="tutorial-feature-card">
                <div className="compact-route-display">
                  <div className="route-step">
                    <div className="route-step-marker complete"><i className="fa-solid fa-check"></i></div>
                    <div className="route-step-info">
                      <span className="route-step-label">Origem</span>
                      <span className="route-step-value">Entrada 1</span>
                    </div>
                  </div>
                  <div className="route-step-connector"></div>
                  <div className="route-step">
                    <div className="route-step-marker complete"><i className="fa-solid fa-map-pin"></i></div>
                    <div className="route-step-info">
                      <span className="route-step-label">Destino</span>
                      <span className="route-step-value">Auditório</span>
                    </div>
                  </div>
                </div>
                  <div class="floating-button-wrapper">
                    <button class="floating-action-button favorite-route-btn" title="Adicionar rota aos favoritos"><i class="fa-regular fa-star"></i></button>
                    <button class="floating-action-button clear-route-main-btn" title="Limpar Rota"><i class="fa-solid fa-xmark"></i></button>
                  </div>
                <div className="feature-card-label">
                  Acompanhe sua rota, delete-a ou salve nos seus favoritos.
                </div>
              </div>

              {/* Card 2: Legenda do Mapa */}
              <div className="tutorial-feature-card">
                  <div className="map-legend open">
                      <div className="map-legend-header">
                          <h4>Legenda</h4>
                          <i className="fa-solid fa-chevron-up open"></i>
                      </div>
                      <div className="map-legend-body">
                          {exampleInitialItems.map((item, index) => (
                            <div key={`initial-${index}`} className="map-legend-item">
                              {item.type === 'color' ? (
                                <span className="map-legend-color-swatch" style={{ backgroundColor: item.value }}></span>
                              ) : (
                                <i className={`map-legend-icon ${item.value}`} style={{ color: item.value.startsWith('fa') ? 'inherit' : item.value }}></i>
                              )}
                              <span>{item.label}</span>
                            </div>
                          ))}
                          {exampleLocationItems.map((item, index) => (
                            <div key={`location-${index}`} className="map-legend-item">
                              {item.type === 'color' ? (
                                <span className="map-legend-color-swatch" style={{ backgroundColor: item.value }}></span>
                              ) : (
                                <i className={`map-legend-icon ${item.value}`} style={{ color: item.value.startsWith('fa') ? 'inherit' : item.value }}></i>
                              )}
                              <span>{item.label}</span>
                            </div>
                          ))}
                      </div>
                  </div>
                  <div className="feature-card-label">
                  Clique na legenda para expandir e ver o significado de ícones e cores no mapa.
                </div>
              </div>

              {/* Card 3: Animação Bottom Sheet */}
              <div className="tutorial-feature-card tutorial-card-full-width">
                <div className="mini-bottom-sheet-animation">
                  <div className="mini-sheet">
                    <div className="mini-sheet-handle"></div>
                  </div>
                </div>
                <div className="feature-card-label-grid">
                  <span><strong>Favoritos:</strong> Acesse suas rotas salvas.</span>
                  <span><strong>Histórico:</strong> Reveja suas rotas recentes.</span>
                  <span><strong>Ajuda:</strong> Encontre dicas e tutoriais.</span>
                  <span><strong>Configurações:</strong> Ajuste o mapa e a acessibilidade.</span>
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="tutorial-backdrop">
      <div className="tutorial-box">
        <button className="tutorial-close-btn" onClick={handleClose}>×</button>
        <div className="tutorial-content">
          {renderContent()}
        </div>
        <div className="tutorial-footer">
          <div className="dont-show-again">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <label htmlFor="dontShowAgain">Não mostrar novamente</label>
          </div>
          <div className="tutorial-navigation">
            {step > 1 && <button onClick={handleBack}>Anterior</button>}
            <button onClick={handleNext}>{step === 3 ? 'Concluir' : 'Próximo'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;


