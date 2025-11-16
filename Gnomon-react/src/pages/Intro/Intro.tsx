import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import Header from '../../components/styles/Header';
import Footer from '../../components/styles/Footer';
import CtaButton from '../../components/CtaButton';
import fotoLucas from '../../assets/Lucas.jpg';
import fotoDavid from '../../assets/David.jpg';
import fotoJoao from '../../assets/Joao.jpg';
import './Intro.css';
import videoBg from '../../assets/Nassau_Intro.mp4';

// ✅ Lazy load do componente pesado de partículas
const ParticlesBackground = lazy(() => 
  import('../../components/ParticlesBackground').then(module => ({
    default: module.ParticlesBackground
  }))
);

// ✅ Hook para detectar mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => 
    window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

// ✅ Hook para detectar se usuário prefere motion reduzido
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

export function Intro() {
  const heroRef = useRef<HTMLElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const { ref: featuresRef, isVisible: featuresVisible } = useScrollAnimation();
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();
  const { ref: teamRef, isVisible: teamVisible } = useScrollAnimation();
  const { ref: testimonialsRef, isVisible: testimonialsVisible } = useScrollAnimation();

  // ✅ Prefetch APENAS em desktop e quando idle
  useEffect(() => {
    if (isMobile) return; // Não prefetch em mobile

    // Usar requestIdleCallback se disponível
    const prefetchWhenIdle = () => {
      const prefetchResources = [
        { href: '/models/Campus.glb', as: 'fetch' },
        { href: '/maps/path-graph.json', as: 'fetch' },
      ];

      const links: HTMLLinkElement[] = [];
      
      prefetchResources.forEach(({ href, as }) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        link.as = as;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
        links.push(link);
      });

      return () => {
        links.forEach(link => link.remove());
      };
    };

    // Esperar 2s antes de fazer prefetch
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(prefetchWhenIdle);
      } else {
        prefetchWhenIdle();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isMobile]);



  // ✅ Pausar auto-rotate quando tab não está visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pausar animações quando tab não está visível
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const stats = [
    { value: '100%', label: 'Cobertura do Campus', icon: 'fa-map-marked-alt' },
    { value: '<5s', label: 'Tempo de Resposta', icon: 'fa-bolt' },
    { value: '24/7', label: 'Disponibilidade', icon: 'fa-clock' },
  ];



  const testimonials = [
    {
      text: 'No meu primeiro dia, estava completamente perdido. O Gnomon me salvou!',
      author: 'Estudante de Engenharia',
      role: '1º Período'
    },
    {
      text: 'Ferramenta essencial para encontrar os laboratórios rapidamente entre as aulas.',
      author: 'Estudante de TI',
      role: '4º Período'
    },
    {
      text: 'Intuitivo e rápido. Deveria ter existido desde sempre!',
      author: 'Estudante de Design',
      role: '2º Período'
    }
  ];

  return (
    <div className="intro-page-wrapper">
      {/* ✅ Partículas APENAS em desktop */}
      {!isMobile && !prefersReducedMotion && (
        <Suspense fallback={null}>
          <ParticlesBackground color="#3498db" />
        </Suspense>
      )}

      <Header />
      <a href="#main-content" className="skip-to-content">
        Pular para conteúdo principal
      </a>

      <main id="main-content">
        <div className="intro-summary-navigation">
          <span className="summary-item summary-item-beneficios">Benefícios</span>
          <span className="summary-item summary-item-simples-rapido">Simples e Rápido</span>
          <span className="summary-item summary-item-depoimentos">Depoimentos</span>
          <span className="summary-item">Nossa Missão</span>
          <span className="summary-item summary-item-time">Time</span>
        </div>
        {/* ===== HERO SECTION ===== */}
        <section id="hero" ref={heroRef}>
          <div className="hero-background">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="hero-video"
              poster="/places/patio.jpg" // ✅ Poster enquanto carrega
              onLoadedData={() => setIsVideoLoaded(true)}
              preload={isMobile ? "none" : "metadata"} // ✅ Não preload em mobile
              width="1920" // Explicit width
              height="1080" // Explicit height
            >
              <source src={videoBg} type="video/mp4" />
            </video>
            <div className="hero-overlay"></div>
          </div>

          {/* ✅ Shapes reduzidas em mobile */}
          {!prefersReducedMotion && (
            <div className="floating-shapes">
              <div className="shape shape-1"></div>
              {!isMobile && <div className="shape shape-2"></div>}
              {!isMobile && <div className="shape shape-3"></div>}
            </div>
          )}

          <div className="container hero-content">
            <div className="hero-badge">
              <i className="fa-solid fa-compass"></i>
              <span>Navegação de Campus Inteligente</span>
            </div>
            
            <h1 className="hero-title">
              Navegue pelo Campus com
              <span className="gradient-text"> Confiança Total</span>
            </h1>
            
            <p className="hero-subtitle">
              Sistema de navegação indoor/outdoor que transforma a experiência universitária.
              Encontre salas, laboratórios e serviços em segundos.
            </p>

            {/* ✅ APENAS UM CTA - REMOVIDO LOGIN */}
            <div className="hero-cta-group">
              <CtaButton to="/mapa" className="cta-primary">
                <span>Começar Agora</span>
                <i className="fa-solid fa-arrow-right"></i>
              </CtaButton>
            </div>

            {/* Quick Stats */}
            <div className="hero-stats">
              <div className="stat-item">
                <i className="fa-solid fa-map-marked-alt"></i>
                <span>Mapa Completo 2D</span>
              </div>
              <div className="stat-item">
                <i className="fa-solid fa-bolt"></i>
                <span>Busca Instantânea</span>
              </div>
              <div className="stat-item">
                <i className="fa-solid fa-mobile"></i>
                <span>100% Responsivo</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== STATS SECTION ===== */}
        <section 
          id="stats" 
          ref={statsRef}
          className={`stats-section ${statsVisible ? 'is-visible' : ''}`}
        >
          <div className="container">
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="stat-card"
                  style={{ '--delay': `${index * 0.1}s` } as React.CSSProperties}
                >
                  <i className={`fa-solid ${stat.icon}`}></i>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* ===== FEATURES GRID ===== */}
        <section 
          id="features" 
          ref={featuresRef}
          className={`features-section ${featuresVisible ? 'is-visible' : ''}`}
        >
          <div className="container">
            <div className="section-header">
              <span className="section-badge">Benefícios</span>
              <h2>Por que escolher o Gnomon?</h2>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <i className="fa-solid fa-route"></i>
                </div>
                <h3>Rotas Otimizadas</h3>
                <p>Algoritmo inteligente que calcula o caminho mais rápido considerando acessibilidade e preferências.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <i className="fa-solid fa-search-location"></i>
                </div>
                <h3>Busca Inteligente</h3>
                <p>Encontre qualquer local digitando apenas parte do nome ou código da sala.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <i className="fa-solid fa-bookmark"></i>
                </div>
                <h3>Favoritos</h3>
                <p>Salve seus locais mais visitados para acesso rápido.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="how-it-works">
          <div className="container">
            <div className="section-header">
              <span className="section-badge">Simples e Rápido</span>
              <h2>Como Funciona</h2>
            </div>

            <div className="steps-timeline">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Busque o Local</h3>
                  <p>Digite o nome da sala, laboratório ou serviço que procura ou escolha um ponto de referência</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Visualize a Rota</h3>
                  <p>Veja o caminho em 2D com instruções passo a passo</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Chegue ao Destino</h3>
                  <p>Siga as instruções visuais e chegue sem estresse</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section 
          id="testimonials" 
          ref={testimonialsRef}
          className={`testimonials-section ${testimonialsVisible ? 'is-visible' : ''}`}
        >
          <div className="container">
            <div className="section-header">
              <span className="section-badge">Depoimentos</span>
              <h2>O que os estudantes ja relataram</h2>
            </div>

            <div className="testimonials-grid">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index} 
                  className="testimonial-card"
                  style={{ '--delay': `${index * 0.15}s` } as React.CSSProperties}
                >
                  <div className="testimonial-quote">
                    <i className="fa-solid fa-quote-left"></i>
                  </div>
                  <p className="testimonial-text">{testimonial.text}</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <div className="author-info">
                      <div className="author-name">{testimonial.author}</div>
                      <div className="author-role">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== ABOUT PROJECT ===== */}
        <section id="about-project">
          <div className="container">
            <div className="about-content">
              <div className="about-text">
                <div className="section-header">
                  <span className="section-badge">Nossa Missão</span>
                  <h2>Transformando a Experiência Universitária</h2>
                </div>
                <p>
                  O Gnomon nasceu da necessidade real de resolver um problema comum: <strong>a dificuldade de 
                  navegação em ambientes acadêmicos complexos</strong>. Sabemos que os primeiros dias no campus 
                  podem ser estressantes, e queremos mudar isso.
                </p>
                <p>
                  Desenvolvido por estudantes, para estudantes, nosso sistema combina tecnologia de ponta 
                  com design intuitivo para criar uma ferramenta verdadeiramente útil no dia a dia acadêmico.
                </p>
                <ul className="about-highlights">
                  <li>
                    <i className="fa-solid fa-check"></i>
                    <span>Desenvolvido com tecnologias modernas</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-check"></i>
                    <span>Interface pensada para facilidade de uso</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-check"></i>
                    <span>Constantemente atualizado com feedback real</span>
                  </li>
                </ul>
              </div>

              <div className="about-visual">
                <div className="visual-card">
                  <i className="fas fa-university"></i>
                  <div className="visual-stats">
                    <div className="visual-stat">
                      <span className="stat-number">10+</span>
                      <span className="stat-label">Pontos Mapeados</span>
                    </div>
                    <div className="visual-stat">
                      <span className="stat-number">2D</span>
                      <span className="stat-label">Visualização</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TEAM ===== */}
        {/* ✅ Lazy load apenas quando visível */}
                  <section
                    id="team"
                    ref={teamRef}
                    className={`team-section ${teamVisible ? 'is-visible' : ''}`}
                  >            <div className="container">
              <div className="section-header">
                <span className="section-badge section-badge-time">Time</span>
                <h2>Conheça Quem Faz Acontecer</h2>
                <p className="team-description-paragraph">Jovens afeiçoados por tecnologia e inovação</p>
              </div>

              <div className="team-grid">
                <div className="team-card">
                  <div className="team-photo">
                    <img 
                      src={fotoLucas} 
                      alt="Lucas Hiago"
                      loading="lazy" // ✅ Lazy loading
                      decoding="async"
                    />
                    <div className="photo-overlay">
                      <div className="social-links">
                        <a href="https://www.linkedin.com/in/lucasbarbosadev42/" aria-label="LinkedIn de Lucas" target="_blank" rel="noopener noreferrer">
                          <i className="fab fa-linkedin"></i>
                        </a>
                        <a href="https://github.com/Lucashiag0" aria-label="GitHub de Lucas" target="_blank" rel="noopener noreferrer">
                          <i className="fab fa-github"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="team-info">
                    <h3>Lucas Hiago</h3>
                    <p className="team-role">Analista de Negócios e Designer de UX/UI</p>
                    <p className="team-description">Responsável pelo planejamento estratégico e design da experiência do usuário</p>
                  </div>
                </div>

                <div className="team-card">
                  <div className="team-photo">
                    <img 
                      src={fotoDavid} 
                      alt="David Roberto"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="photo-overlay">
                      <div className="social-links">
                        <a href="https://www.linkedin.com/in/david-roberto-31724a376/" aria-label="LinkedIn de David" target="_blank" rel="noopener noreferrer">
                          <i className="fab fa-linkedin"></i>
                        </a>
                        <a href="https://github.com/DavidRdS" aria-label="GitHub de David" target="_blank" rel="noopener noreferrer">
                          <i className="fab fa-github"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="team-info">
                    <h3>David Roberto</h3>
                    <p className="team-role">DBA, QA e Engenheiro de Segurança</p>
                    <p className="team-description">Responsavel pelos testes de segurança, qualidade e do banco de dados</p>
                  </div>
                </div>

                <div className="team-card">
                  <div className="team-photo">
                    <img 
                      src={fotoJoao} 
                      alt="João Marcos"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="photo-overlay">
                      <div className="social-links">
                        <a href="https://www.linkedin.com/in/joao-marcos-ferreira-vilela/" aria-label="LinkedIn de João" target="_blank" rel="noopener noreferrer">
                          <i className="fab fa-linkedin"></i>
                        </a>
                        <a href=" https://github.com/JaoVile" aria-label="GitHub de João" target="_blank" rel="noopener noreferrer">
                          <i className="fab fa-github"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="team-info">
                    <h3>João Marcos</h3>
                    <p className="team-role">Gerente de Produtos, Arquiteto de software e Eng. DevOps</p>
                    <p className="team-description">Responsável pela estrutura e implantação do sistema</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

        {/* ===== FINAL CTA ===== */}
        <section id="final-cta">
          <div className="cta-background">
            <div className="cta-pattern"></div>
          </div>
          <div className="container">
            <div className="cta-content">
              <h2>Pronto para Explorar o Campus?</h2>
              <p>
                Junte-se a dezenas de estudantes que já navegam pelo campus com confiança.
                Comece agora gratuitamente.
              </p>
              <div className="cta-buttons">
                <CtaButton to="/mapa" className="cta-primary-large">
                  <span>Abrir Mapa Interativo</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </CtaButton>
              </div>
              <p className="cta-note">
                <i className="fa-solid fa-shield-halved"></i>
                Não requer instalação • Funciona em qualquer dispositivo
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}