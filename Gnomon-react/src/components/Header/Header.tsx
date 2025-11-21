import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logoIcon from '../../assets/Gnomon Logo _ SEM NOME.png';
import { ThemeSwitcher } from '../Theme/ThemeSwitcher';
import './Header.css';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prefetch do GLB ao passar o mouse
  const prefetchGLB = () => {
    const id = 'prefetch-campus-glb'
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id
      link.rel = 'prefetch'
      link.href = '/models/Campus.glb'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    }
  }

  return (
    <header className={isScrolled ? 'scrolled' : ''}>
      <div className="container">
        <Link to="/" className="logo-container">
          <img 
            src={logoIcon} 
            alt="Ícone do Gnomon"
          />
          <span>GNOMON</span>
        </Link>

        <nav>
          <ThemeSwitcher />

          <Link
            to="/mapa"
            className="cta-button"
            aria-label="Abrir guia do campus"
            onMouseEnter={prefetchGLB}
            onFocus={prefetchGLB}
          >
            Abrir Guia
          </Link>
        </nav>
      </div>
    </header>
  )
}