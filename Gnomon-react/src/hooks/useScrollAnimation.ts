import { useEffect, useRef, useState, useMemo } from 'react';

// ✅ Interface para opções customizáveis
interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  enabled?: boolean;
}

/**
 * Hook otimizado para animações on scroll
 * - Usa IntersectionObserver para performance
 * - Desconecta automaticamente após trigger (se triggerOnce = true)
 * - Suporta rootMargin para trigger antecipado
 * - Pode ser desabilitado condicionalmente
 */
export function useScrollAnimation({
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px', // ✅ Trigger um pouco antes de entrar na tela
  triggerOnce = true,
  enabled = true,
}: UseScrollAnimationOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ✅ Memoizar opções do observer
  const observerOptions = useMemo(
    () => ({
      threshold,
      rootMargin,
    }),
    [threshold, rootMargin]
  );

  useEffect(() => {
    // ✅ Não fazer nada se desabilitado
    if (!enabled) return;

    const currentRef = ref.current;
    if (!currentRef) return;

    // ✅ Callback do observer
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      if (entry.isIntersecting) {
        setIsVisible(true);
        
        // ✅ Desconectar após aparecer (performance)
        if (triggerOnce && observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      } else if (!triggerOnce) {
        // ✅ Permitir re-trigger se triggerOnce = false
        setIsVisible(false);
      }
    };

    // ✅ Criar observer
    observerRef.current = new IntersectionObserver(handleIntersect, observerOptions);
    observerRef.current.observe(currentRef);

    // ✅ Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [enabled, triggerOnce, observerOptions]);

  return { ref, isVisible };
}

// ✅ Hook para scroll progress otimizado
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId: number | null = null;
    let lastKnownScrollPosition = 0;
    let ticking = false;

    const handleScroll = () => {
      lastKnownScrollPosition = window.scrollY;

      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = scrollHeight > 0 ? (lastKnownScrollPosition / scrollHeight) * 100 : 0;
          setProgress(Math.min(Math.max(progress, 0), 100));
          ticking = false;
        });

        ticking = true;
      }
    };

    // ✅ Passive listener para melhor performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    // ✅ Calcular progresso inicial
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return progress;
}

// ✅ Hook para detectar quando elemento está visível (simples)
export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      options
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref, isInView };
}

// ✅ Hook para detectar direção do scroll
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let rafId: number | null = null;
    let ticking = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          if (currentScrollY > lastScrollY.current) {
            setScrollDirection('down');
          } else if (currentScrollY < lastScrollY.current) {
            setScrollDirection('up');
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return scrollDirection;
}

// ✅ Hook para scroll to top suave
export function useScrollToTop() {
  const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({
      top: 0,
      behavior,
    });
  };

  return scrollToTop;
}