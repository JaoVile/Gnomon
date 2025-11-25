import React, { useState, useRef, useEffect } from 'react';
import './Tutorial.css';
import gnomonLogo from '/Gnomon_Sem_Nome_Icon.png'; // Importando o logo

interface TutorialProps {
  onClose: (dontShowAgain: boolean) => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const tutorialBoxRef = useRef<HTMLDivElement>(null);

  // Efeito para rolar para o topo sempre que a etapa (step) mudar
  useEffect(() => {
    if (tutorialBoxRef.current) {
      // Reseta a posição da barra de rolagem para o topo
      tutorialBoxRef.current.scrollTop = 0;
    }
  }, [step]); // O array de dependências garante que isso rode apenas quando 'step' mudar


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
          <div className="step-welcome-container">
            <div className="logo-animation-wrapper">
              {/* Círculos de "Radar" que pulsam atrás do logo */}
              <div className="radar-pulse ring-1"></div>
              <div className="radar-pulse ring-2"></div>
              <div className="radar-pulse ring-3"></div>
              
              {/* Seu Logo flutuando */}
              <img src={gnomonLogo} alt="Gnomon Logo" className="tutorial-logo floating-logo" />
            </div>

            <h2>Bem-vindo ao Gnomon!</h2>
            <p>
              Este é um aplicativo em <strong>versão beta</strong> e está em contínuo desenvolvimento.
              <br />
              Sua ajuda é fundamental para aprimorarmos sua experiência.
            </p>
          </div>
        );
      case 2:
        return (
          <div className="step-container">
            <h2>Como Navegar</h2>
            <p>Siga estes passos para encontrar seu caminho.</p>
            
            <div className="tutorial-features-grid step2">
              
              {/* Card 1: Pins (Com animação de pulo) */}
              <div className="tutorial-feature-card stagger-1">
                <div className="feature-card-icon-group">
                  <i className="feature-card-icon entry-point fa-solid fa-location-dot animate-bounce-soft" style={{animationDelay: '0s'}}></i>
                  <i className="feature-card-icon place-point fa-solid fa-location-dot animate-bounce-soft" style={{animationDelay: '0.4s', color: '#FFD700'}}></i>
                </div>
                <div className="feature-card-label">
                  <strong>1. Explore</strong>
                  <span>Toque nos ícones do mapa para ver detalhes.</span>
                </div>
              </div>

              {/* Card 2: Ações (Botão pulsando) */}
              <div className="tutorial-feature-card stagger-2 center-content">
                <div className="feature-card-icon-group column-group">
                  <div className="mini-popup-button static">
                    <i className="fa-solid fa-location-dot"></i> Estou aqui
                  </div>
                  {/* Ícone animado movido para fora e centralizado pelo column-group */}
                  <i className="feature-card-icon destination-point fa-solid fa-location-dot drop-in-pin"></i>
                  <div className="feature-card-label">
                    <strong>2. Defina</strong>
                    <span>Escolha seu local de origem.</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Seleção (Foco) */}
              <div className="tutorial-feature-card stagger-3 center-content">
                   <div className="selection-circle"></div>
             
                <div className="mini-popup-button primary animate-pulse-gentle">
                  <i className="fa-solid fa-route"></i> Ir para cá
                </div>
                <div className="feature-card-label">
                  <strong>3. Escolha</strong>
                  <span>Escolha seu destino entre os pontos.</span>
                </div>
              </div>

              {/* Card 4: Rota (Animação refinada) */}
              <div className="tutorial-feature-card stagger-4">
                <div className="route-animation-container-v2">
                  {/* Pin Origem */}
                  <i className="feature-card-icon start-point fa-solid fa-circle-dot" style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}></i>
                  
                  {/* Linha SVG */}
                  <svg className="animated-route-svg" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <path className="animated-route-path" d="M5 20 Q 50 5, 95 20" vectorEffect="non-scaling-stroke"/>
                  </svg>
                  
                  {/* Pin Destino (Verde) */}
                  <i className="feature-card-icon final-destination-point fa-solid fa-location-dot"></i>
                </div>
                
                <div className="feature-card-label">
                  <strong>4. Navegue</strong>
                  <span>Siga a linha traçada até seu objetivo.</span>
                </div>
              </div>

            </div>
          </div>
        );
      // ... dentro do switch(step)
      case 3:
        return (
          <div className="step-container">
            <h2>Explore e Navegue</h2>
            
            <div className="tutorial-features-grid step3">

              {/* Card 1: Rota Compacta (Versão Mini) */}
              <div className="tutorial-feature-card stagger-1">
                <div className="compact-route-display mini">
                  <div className="route-step">
                    <div className="route-step-marker complete small"><i className="fa-solid fa-check"></i></div>
                    <div className="route-step-info">
                      <span className="route-step-label">Origem</span>
                      <span className="route-step-value">Entrada 1</span>
                    </div>
                  </div>
                  <div className="route-step-connector small"></div>
                  <div className="route-step">
                    <div className="route-step-marker complete small"><i className="fa-solid fa-map-pin"></i></div>
                    <div className="route-step-info">
                      <span className="route-step-label">Destino</span>
                      <span className="route-step-value">Auditório</span>
                    </div>
                  </div>
                </div>
                <div className="feature-card-label">
                  <strong>Gerencie</strong>
                  <span>Veja aonde você está e para onde vai.</span>
                </div>
                {/* Botões de Ação Flutuantes (Visual apenas) */}
                <div className="floating-button-wrapper">
                  <button className="tutorial-floating-btn favorite-route-btn" title="Adicionar rota aos favoritos">
                    <i className="fa-regular fa-star"></i>
                  </button>
                  <button className="tutorial-floating-btn clear-route-main-btn" title="Limpar Rota">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div className="feature-card-label">
                  <span>Salve nos favoritos ou limpe a rota.</span>
                </div>
              </div>

              {/* Card 2: Legenda Interativa (Réplica Animada) */}
              <div className="tutorial-feature-card stagger-2 split-card">
                {/* Seção da Animação (66.6%) */}
                <div className="split-section animation-section">
                  <div className="drag-hand-anim"><i className="fa-solid fa-hand-pointer"></i></div>
                  <div className="map-legend tutorial-version">
                    <div className="map-legend-header">
                      <h4>Legenda</h4>
                      <i className="fa-solid fa-chevron-down legend-chevron-anim"></i>
                    </div>
                    <div className="map-legend-body">
                      <div className="legend-separator"></div>
                      <div className="map-legend-item"><i className="fas fa-map-marker-alt map-legend-icon" style={{color: 'rgb(234, 67, 53)'}}></i><span>Entradas</span></div>
                      <div className="map-legend-item"><i className="fas fa-map-marker-alt map-legend-icon" style={{color: 'rgb(255, 215, 0)'}}></i><span>Referências</span></div>
                      <div className="map-legend-item"><span className="map-legend-color-swatch" style={{backgroundColor: 'rgb(217, 237, 146)'}}></span><span>Coord.</span></div>
                      <div className="map-legend-item"><span className="map-legend-color-swatch" style={{backgroundColor: 'rgb(255, 179, 186)'}}></span><span>Auditório</span></div>
                      <div className="map-legend-item"><span className="map-legend-color-swatch" style={{backgroundColor: 'rgb(70, 85, 180)'}}></span><span>Cantina</span></div>
                      <div className="map-legend-item"><span className="map-legend-color-swatch" style={{backgroundColor: 'rgb(0, 255, 255)'}}></span><span>Labs</span></div>
                      <div className="map-legend-item"><span className="map-legend-color-swatch" style={{backgroundColor: 'rgb(255, 255, 0)'}}></span><span>Biblioteca</span></div>
                      <div className="map-legend-item"><span className="map-legend-color-swatch" style={{backgroundColor: 'rgb(221, 160, 221)'}}></span><span>Banheiros</span></div>
                      <div className="map-legend-item"><span className="map-legend-color-swatch" style={{backgroundColor: 'rgb(240, 230, 141)'}}></span><span>Salas</span></div>
                    </div>
                  </div>
                </div>
                {/* Seção do Texto (33.4%) */}
                <div className="split-section text-section">
                  <div className="feature-card-label">
                    <strong>Legenda Dinâmica</strong>
                    <span>Clique e arraste para ver os locais.</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Bottom Sheet (Clean List) */}
              <div className="tutorial-feature-card tutorial-card-full-width stagger-3">
                <div className="sheet-content-wrapper">
                    <div className="sheet-animation-group">
                      <span className="animation-label">Arraste para ver mais funções</span>
                      {/* Contêiner para isolar a animação */}
                      <div className="animation-container">                      
                        <div className="mini-bottom-sheet-visual">                        
                          <div className="mini-sheet-header">
                            <div className="sheet-handle"></div>
                          </div>
                          {/* Conteúdo realista que será revelado */}
                          <div className="mini-sheet-content-realistic">
                            {/* Fake Search Bar */}
                            <div className="mini-search-bar">
                              <i className="fas fa-search"></i>
                            </div>
                            {/* Fake Featured Places */}
                            <div className="mini-featured-place"></div>
                            <div className="mini-featured-place"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lista Limpa */}
                    <div className="clean-sheet-list">
                        <div className="sheet-list-item">
                            <i className="fa-solid fa-star" style={{color: '#0062ffff'}}></i>
                            <span><strong>Favoritos:</strong> Suas rotas salvas.</span>
                        </div>
                        <div className="sheet-list-item">
                            <i className="fa-solid fa-clock-rotate-left" style={{color: '#2196F3'}}></i>
                            <span><strong>Histórico:</strong> Locais visitados.</span>
                        </div>
                        <div className="sheet-list-item">
                            <i className="fa-solid fa-gear" style={{color: '#757575'}}></i>
                            <span><strong>Ajustes:</strong> Opções do mapa.</span>
                        </div>
                    </div>
                </div>
              </div>

            </div>
          </div>
        );
// ... restante
      default:
        return null;
    }
  };

  return (
    <div className="tutorial-backdrop">
      <div className="tutorial-box" ref={tutorialBoxRef}>
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
              // O 'any' desliga a checagem chata apenas para este evento
              onChange={(e: any) => setDontShowAgain(e.target.checked)}
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
