import { useState, useEffect, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import logoIcon from '../assets/Gnomon Logo _ SEM NOME.png'
function setMetaThemeColor(hex: string) {
let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
if (!meta) {
meta = document.createElement('meta')
meta.setAttribute('name', 'theme-color')
document.head.appendChild(meta)
}
meta.setAttribute('content', hex)
}

export default function Header() {
const [theme, setTheme] = useState<string>(localStorage.getItem('theme') || 'dark')

useEffect(() => {
const bodyClass = document.body.classList
theme === 'light' ? bodyClass.add('light-mode') : bodyClass.remove('light-mode')
localStorage.setItem('theme', theme)
// dispara evento global e ajusta status bar
window.dispatchEvent(new CustomEvent('theme:change', { detail: { theme } }))
setMetaThemeColor(theme === 'light' ? '#fbfaf6' : '#0b0f11')
}, [theme])

const handleThemeChange = (e: ChangeEvent<HTMLInputElement>) => {
setTheme(e.target.checked ? 'light' : 'dark')
}

// Prefetch do GLB ao passar o mouse ou focar no botão
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
<header>
<div className="container">
<Link to="/" className="logo-container">
<img src={logoIcon} alt="Ícone do Gnomon" />
<span>GNOMON</span>
</Link>


    <nav>
      <div className="theme-switcher">
        <i className="fas fa-moon"></i>
        <label className="theme-switch-wrapper">
          <input
            type="checkbox"
            id="theme-switcher"
            className="theme-switch-checkbox"
            checked={theme === 'light'}
            onChange={handleThemeChange}
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
        onMouseEnter={prefetchGLB}
        onFocus={prefetchGLB}
        aria-label="Abrir guia do campus"
      >
        Abrir Guia
      </Link>
    </nav>
  </div>
</header>
)
}