import React, { useEffect, useRef } from 'react';
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
  const dragState = useRef({
    isDragging: false,
    dragStartTime: 0,
    startY: 0,
    currentTranslateY: 0,
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
    sheetRef.current?.style.setProperty('transition', 'none');
  };

  const onDragMove = (e: React.TouchEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => {
    if (!dragState.isDragging) return;

    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - dragState.startY;

    if (isOpen) {
      const newTranslateY = deltaY;
      // Impede que a folha seja arrastada para cima além da posição totalmente aberta (translateY = 0)
      dragState.currentTranslateY = Math.max(0, newTranslateY);
    } else { // Sheet is in closed/peeked state
      const sheetHeight = getSheetHeight();
      const peekHeight = parseInt(getComputedStyle(sheetRef.current!).getPropertyValue('--sheet-peek-height'));
      const closedY = sheetHeight - peekHeight; // This is the translateY value when closed
      const newTranslateY = closedY + deltaY;
      // Impede que a folha seja arrastada para baixo além da posição fechada/peeked
      dragState.currentTranslateY = Math.min(closedY, newTranslateY);
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
    const sheetHeight = getSheetHeight();
    
    const isQuickFlick = dragDuration < 250;
    const flickThreshold = 50;
    const positionThreshold = sheetHeight * 0.4;

    const dragDistance = dragState.currentTranslateY - (isOpen ? 0 : sheetHeight);

    if (isOpen) {
      if ((isQuickFlick && dragDistance > flickThreshold) || (!isQuickFlick && dragState.currentTranslateY > positionThreshold)) {
        onClose();
      } else {
        onOpen();
      }
    } else {
      if ((isQuickFlick && dragDistance < -flickThreshold) || (!isQuickFlick && dragState.currentTranslateY < sheetHeight - positionThreshold)) {
        onOpen();
      } else {
        onClose();
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
        className={`bottom-sheet-container ${isOpen ? 'open' : ''}`}
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
          <div className="drag-handle"></div>
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
