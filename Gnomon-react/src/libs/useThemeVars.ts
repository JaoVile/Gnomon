<<<<<<< HEAD
// src/libs/useThemeVars.ts
import { useEffect, useMemo, useState } from 'react';

export type ThemeVars = {
  // cores principais usadas no mapa/rotas
  routePrimary: string;
  routeAccessible: string;
  routeRestricted: string;

  // aparência
  bg3d: string;
  text: string;
  textDim: string;
  panelBg: string;

  // estados
  isLight: boolean;
  isHighContrast: boolean;
};

type ThemeApi = {
  setTheme: (mode: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setHighContrast: (enabled: boolean) => void;
};

const DEFAULTS: ThemeVars = {
  routePrimary: '#00aef0',
  routeAccessible: '#34c759',
  routeRestricted: '#ffcc00',
  bg3d: '#0f1114',
  text: '#e7edf3',
  textDim: '#9aa6b2',
  panelBg: 'rgba(17,17,17,0.72)',
  isLight: false,
  isHighContrast: false,
};

function readCssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function readTheme(): ThemeVars {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light-mode');
  const isHighContrast =
    typeof document !== 'undefined' && document.body.classList.contains('accessibility-high-contrast');

  // tenta pegar bg específico do 3D; se não houver, usa cor de fundo global
  const bg3d = readCssVar('--bg-3d', readCssVar('--cor-fundo', DEFAULTS.bg3d));

  return {
    routePrimary: readCssVar('--route-primary', DEFAULTS.routePrimary),
    routeAccessible: readCssVar('--route-accessible', DEFAULTS.routeAccessible),
    routeRestricted: readCssVar('--route-restricted', DEFAULTS.routeRestricted),
    bg3d,
    text: readCssVar('--cor-texto', DEFAULTS.text),
    textDim: readCssVar('--cor-texto-secundario', DEFAULTS.textDim),
    panelBg: readCssVar('--panel-bg', DEFAULTS.panelBg),
    isLight,
    isHighContrast,
  };
}

export function useThemeVars(): ThemeVars & ThemeApi {
  const [vars, setVars] = useState<ThemeVars>(() => {
    try {
      return readTheme();
    } catch {
      return DEFAULTS;
    }
  });

  // Observa mudanças de classe no <html> (light-mode) e no <body> (alto contraste)
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return;

    const update = () => setVars(readTheme());

    const obsHtml = new MutationObserver(update);
    const obsBody = new MutationObserver(update);

    obsHtml.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    obsBody.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // mudanças de storage (tema alterado em outra aba)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme' || e.key === 'nav.accessible') update();
    };
    window.addEventListener('storage', onStorage);

    // 1º update após mount (garante leitura correta do CSS já aplicado)
    update();

    return () => {
      obsHtml.disconnect();
      obsBody.disconnect();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const api = useMemo<ThemeApi>(() => {
    return {
      setTheme: (mode: 'light' | 'dark') => {
        const isLight = mode === 'light';
        document.documentElement.classList.toggle('light-mode', isLight);
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        // atualiza vars após mudar classe
        setVars(readTheme());
      },
      toggleTheme: () => {
        const nowLight = !document.documentElement.classList.contains('light-mode');
        document.documentElement.classList.toggle('light-mode', nowLight);
        localStorage.setItem('theme', nowLight ? 'light' : 'dark');
        setVars(readTheme());
      },
      setHighContrast: (enabled: boolean) => {
        document.body.classList.toggle('accessibility-high-contrast', enabled);
        setVars(readTheme());
      },
    };
  }, []);

  return { ...vars, ...api };
}

export default useThemeVars;
=======
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
accent: get('--cor-destaque') || '#1f6fe5',
bg3d: get('--sp-ink') || '#0b0f11',
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
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
