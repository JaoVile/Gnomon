import React, { useEffect, useRef, useState } from 'react';
import './BottomSheet.css';

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void; // Prop to request opening
  children: React.ReactNode;
  title?: string;
};

export function BottomSheet({ isOpen, onClose, onOpen, children, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isBouncing, setIsBouncing] = useState(false);
  const dragState = useRef({
    isDragging: false,
    dragStartTime: 0,
    startY: 0,
    currentTranslateY: 0,
    initialTranslateY: 0, // Adicionado para rastrear a posição inicial
  }).current;

  const getSheetHeight = () => sheetRef.current?.getBoundingClientRect().height || 0;

  const setTranslateY = (y: number) => {
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${y}px)`;
    }
  };

  const onDragStart = (e: React.TouchEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    dragState.isDragging = true;
    dragState.dragStartTime = Date.now();
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragState.startY = startY;

    // Captura o translateY atual, pois pode estar em transição
    const transform = window.getComputedStyle(sheetRef.current!);
    dragState.initialTranslateY = new DOMMatrix(transform.transform).m42;
    
    sheetRef.current?.style.setProperty('transition', 'none');
  };

  const onDragMove = (e: React.TouchEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => {
    if (!dragState.isDragging) return;

    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - dragState.startY;
    const newTranslateY = dragState.initialTranslateY + deltaY;

    // Impede que a folha seja arrastada para além do topo da tela (translateY < 0)
    const topLimit = 0; 
    const sheetHeight = getSheetHeight();
    const peekHeight = parseInt(getComputedStyle(sheetRef.current!).getPropertyValue('--sheet-peek-height'));
    const closedY = sheetHeight - peekHeight; // Posição inicial/fechada

    if (newTranslateY < topLimit) {
      dragState.currentTranslateY = topLimit;
      if (!isBouncing) {
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 300); // Duração da animação de bounce
      }
    } else if (newTranslateY > closedY) { // Limita o arrasto para baixo
      dragState.currentTranslateY = closedY;
      // Opcional: adicionar um bounce para baixo também, se desejado
    }
    else {
      dragState.currentTranslateY = newTranslateY;
    }
    
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => {
        setTranslateY(dragState.currentTranslateY);
        animationFrameRef.current = null;
      });
    }
  };

  const onDragEnd = () => {
    if (!dragState.isDragging) return;
    dragState.isDragging = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    sheetRef.current?.style.removeProperty('transition');

    const dragDuration = Date.now() - dragState.dragStartTime;
    const isQuickFlick = dragDuration < 250;
    const flickThreshold = 50;
    const positionThreshold = getSheetHeight() * 0.4;

    const sheetHeight = getSheetHeight();
    const peekHeight = parseInt(getComputedStyle(sheetRef.current!).getPropertyValue('--sheet-peek-height'));
    const closedY = sheetHeight - peekHeight;

    const isQuickFlickUp = isQuickFlick && (dragState.currentTranslateY < dragState.initialTranslateY - flickThreshold);
    const isQuickFlickDown = isQuickFlick && (dragState.currentTranslateY > dragState.initialTranslateY + flickThreshold);

    // Se estava aberto, decide se deve fechar
    if (isOpen) {
      if (isQuickFlickDown || (!isQuickFlick && dragState.currentTranslateY > positionThreshold)) {
        onClose();
      }
      else {
        onOpen(); // Volta para o estado aberto
      }
    // Se estava fechado, decide se deve abrir
    } else {
      if (isQuickFlickUp || (!isQuickFlick && dragState.currentTranslateY < closedY - positionThreshold)) {
        onOpen();
      }
      else {
        onClose(); // Volta para o estado fechado
      }
    }
  };

  const handleHeaderClick = () => {
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  };

  // Efeito para fechar com a tecla 'Esc'
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside); // Adiciona listener para clique fora
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside); // Remove listener
    };
  }, [isOpen, onClose]);

  // Efeito para limpar o transform inline após a animação CSS
  useEffect(() => {
    const handleTransitionEnd = () => {
      if (!dragState.isDragging) {
        sheetRef.current?.style.removeProperty('transform');
      }
    };

    const sheetElement = sheetRef.current;
    sheetElement?.addEventListener('transitionend', handleTransitionEnd);

    return () => {
      sheetElement?.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [dragState.isDragging]);

  return (
    <>
      <div 
        className={`bottom-sheet-backdrop ${isOpen ? 'visible' : ''}`} 
        onClick={onClose}
      ></div>
      <div 
        ref={sheetRef}
        className={`bottom-sheet-container ${isOpen ? 'open' : ''} ${isBouncing ? 'bouncing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        <header 
          className="bottom-sheet-header"
          onClick={handleHeaderClick}
          onMouseDown={(e) => onDragStart(e)}
          onMouseMove={(e) => onDragMove(e)}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          onTouchStart={(e) => onDragStart(e)}
          onTouchMove={(e) => onDragMove(e)}
          onTouchEnd={onDragEnd}
        >
          {isOpen ? (
            <div className="close-button">
              <i className="fa-solid fa-xmark"></i>
            </div>
          ) : (
            <div className="drag-handle"></div>
          )}
          {/* O título só aparece quando a aba está aberta para um look mais clean */}
          {isOpen && title && <h2 id="bottom-sheet-title" className="bottom-sheet-title">{title}</h2>}
        </header>
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  );
}
