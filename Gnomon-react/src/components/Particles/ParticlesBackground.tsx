import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type Container, type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { useThemeVars } from "../../libs/useThemeVars";
import { useTheme } from "../Theme/ThemeContext";

// ✅ Define um tipo para as variáveis de tema que esperamos receber.
interface ThemeVariables {
  primary: string;
  text: string;
}

// ✅ Detectar se é mobile
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
};

// ✅ Detectar se usuário prefere motion reduzido
const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export function ParticlesBackground({ color }: { color?: string }) {
  const [init, setInit] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const isMobile = useMemo(() => isMobileDevice(), []);
  const { theme } = useTheme();
  const themeVars = useThemeVars();

  // ✅ Inicializar engine apenas uma vez
  useEffect(() => {
    // ✅ Não renderizar se motion reduzido
    if (prefersReducedMotion()) {
      setShouldRender(false);
      return;
    }

    // ✅ Inicializar apenas se deve renderizar
    if (shouldRender) {
      initParticlesEngine(async (engine) => {
        await loadSlim(engine);
      }).then(() => {
        setInit(true);
      });
    }
  }, [shouldRender]);

  // ✅ Callback otimizado
  const particlesLoaded = async (container?: Container): Promise<void> => {
    // ✅ Remover console.log em produção
    if (process.env.NODE_ENV === 'development') {
      console.log('Particles loaded:', container);
    }
  };

  // ✅ Configurações otimizadas por dispositivo
  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      // ✅ FPS limit menor em mobile
      fpsLimit: isMobile ? 30 : 60,
      
      interactivity: {
        // ✅ Desabilitar interatividade em mobile
        events: {
          onClick: {
            enable: !isMobile,
            mode: "push",
          },
          onHover: {
            enable: !isMobile,
            mode: "repulse",
          },
        },
        modes: {
          push: {
            quantity: 2,
          },
          repulse: {
            distance: isMobile ? 50 : 100,
            duration: 0.2,
          },
        },
      },
      
      particles: {
        color: {
          value: color || (theme === 'light' ? (themeVars as unknown as ThemeVariables).primary : (themeVars as unknown as ThemeVariables).text),
        },
        links: {
          color: color || (theme === 'light' ? (themeVars as unknown as ThemeVariables).primary : (themeVars as unknown as ThemeVariables).text),
          distance: isMobile ? 100 : 150,
          enable: true,
          opacity: isMobile ? 0.1 : 0.15,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: false,
          speed: isMobile ? 0.5 : 1,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            width: isMobile ? 800 : 1920,
            height: isMobile ? 600 : 1080,
          },
          value: isMobile ? 30 : 80,
        },
        opacity: {
          value: isMobile ? 0.2 : 0.3,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: isMobile ? 2 : 3 },
        },
      },
      
      detectRetina: true,
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
      smooth: true,
      manualParticles: [],
    }), [isMobile, theme, themeVars, color] // ✅ Adiciona dependências do tema e cor
  );

  // ✅ Não renderizar se não deve ou não inicializou
  if (!shouldRender || !init) {
    return null;
  }

  return (
    <Particles
      id="tsparticles"
      particlesLoaded={particlesLoaded}
      options={options}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
    />
  );
}

export default ParticlesBackground