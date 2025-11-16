import { Link } from 'react-router-dom';
import fotoLucas from '../../assets/Lucas.jpg';
import fotoDavid from '../../assets/David.jpg';
import fotoJoao from '../../assets/Joao.jpg';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          {/* Coluna 1: Sobre */}
          <div className="footer-section">
            <h3>GNOMON</h3>
            <p>Um guia interativo para simplificar a navegação no campus universitário.</p>
            <div className="footer-social">
              <a 
                href="https://github.com/JaoVile/Gnomon" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="GitHub do projeto"
              >
                <i className="fab fa-github"></i>
              </a>
            </div>
          </div>

          {/* Coluna 2: Links Úteis */}
          <div className="footer-section">
            <h3>Links Úteis</h3>
            <a href="#hero" onClick={(e) => { e.preventDefault(); scrollToSection('hero'); }}>
              Início
            </a>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>
              Funcionalidades
            </a>
            <a href="#about-project" onClick={(e) => { e.preventDefault(); scrollToSection('about-project'); }}>
              Sobre
            </a>
            <a href="#team" onClick={(e) => { e.preventDefault(); scrollToSection('team'); }}>
              Equipe
            </a>
          </div>

          {/* Coluna 3: Acesso */}
          <div className="footer-section">
            <h3>Acesso</h3>
            <Link to="/mapa">Abrir Guia</Link>
          </div>

          {/* Coluna 4: Projeto */}
          <div className="footer-section">
            <h3>Projeto</h3>
            <p>UNINASSAU - Caruaru, PE</p>
            <p>Análise e Des. de Sistemas</p>
            <p>{currentYear}</p>
          </div>
        </div>
      </div>

      {/* Footer Bottom com Equipe */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-team">
            <span className="team-label">Desenvolvido por</span>
            <div className="team-avatars">
              <div className="team-member">
                <img src={fotoLucas} alt="Lucas Hiago" />
                <div className="member-tooltip">
                  <strong>Lucas Hiago</strong>
                  <span>Analista de Negócios e Designer de UX/UI</span>
                  <div className="social-mini">
                    <a href="https://www.linkedin.com/in/lucasbarbosadev42/" aria-label="LinkedIn de Lucas" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin"></i></a>
                    <a href="https://github.com/Lucashiag0" aria-label="GitHub de Lucas" target="_blank" rel="noopener noreferrer"><i className="fab fa-github"></i></a>
                  </div>
                </div>
              </div>
              <div className="team-member">
                <img src={fotoDavid} alt="David Roberto" />
                <div className="member-tooltip">
                  <strong>David Roberto</strong>
                  <span>DBA, QA e Engenheiro de Segurança</span>
                  <div className="social-mini">
                    <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
                    <a href="https://github.com/DavidRdS" aria-label="GitHub de David" target="_blank" rel="noopener noreferrer"><i className="fab fa-github"></i></a>
                  </div>
                </div>
              </div>
              <div className="team-member">
                <img src={fotoJoao} alt="João Marcos" />
                <div className="member-tooltip">
                  <strong>João Marcos</strong>
                  <span>Gerente de Produtos, Arquiteto de software e Eng. DevOps</span>
                  <div className="social-mini">
                    <a href="https://www.linkedin.com/in/joao-marcos-ferreira-vilela/" aria-label="LinkedIn de João" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin"></i></a>
                    <a href="https://github.com/JaoVile" aria-label="GitHub de João" target="_blank" rel="noopener noreferrer"><i className="fab fa-github"></i></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="copyright">
            &copy; {currentYear} Projeto Gnomon. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}