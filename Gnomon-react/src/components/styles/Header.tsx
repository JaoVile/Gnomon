import { useState, useEffect, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import logoIcon from '../../assets/Gnomon Logo _ SEM NOME.png'

export default function Header() {
  const [theme, setTheme] = useState<string>(localStorage.getItem('theme') || 'dark')
  const [isScrolled, setIsScrolled] = useState(false)

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Aplicar tema
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    window.dispatchEvent(new CustomEvent('theme:change', { detail: { theme } }))
  }, [theme])

  const handleThemeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.checked ? 'light' : 'dark')
  }

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
          <div className="theme-switcher">
            <i className="fas fa-moon"></i>
            <label className="theme-switch-wrapper">
              <input
                id="theme-switcher"
                className="theme-switch-checkbox"
                checked={theme === 'light'}
                onChange={handleThemeChange}
                type="checkbox"
              />
              <div className="theme-switch">
                <div className="slider"></div>
              </div>
            </label>
            <i className="fas fa-sun"></i>
          </div>

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