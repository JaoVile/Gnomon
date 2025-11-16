import { useEffect, useMemo, useState } from 'react'
type Vars = {
theme: 'dark' | 'light'
routePrimary: string
routeAccessible: string
routeRestricted: string
accent: string
bg3d: string
}

function readVars(): Vars {
const css = getComputedStyle(document.documentElement)
const get = (name: string) => css.getPropertyValue(name).trim()
const isLight = document.body.classList.contains('light-mode')
return {
theme: isLight ? 'light' : 'dark',
routePrimary: get('--route-primary') || '#1f6fe5',
routeAccessible: get('--route-accessible') || '#77a88d',
routeRestricted: get('--route-restricted') || '#ff6b6b',
accent: get('--primary') || '#1f6fe5',
bg3d: get('--sp-ink') || get('--background-dark') || '#0b0f11',
}
}

export function useThemeVars(): Vars {
const [vars, setVars] = useState<Vars>(() => readVars())

useEffect(() => {
const onChange = () => setVars(readVars())
// Observa mudanças de classe no body e evento customizado
const obs = new MutationObserver(onChange)
obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
window.addEventListener('theme:change', onChange)
return () => {
obs.disconnect()
window.removeEventListener('theme:change', onChange)
}
}, [])

return useMemo(() => vars, [vars.theme, vars.routePrimary, vars.routeAccessible, vars.routeRestricted, vars.accent, vars.bg3d])
}