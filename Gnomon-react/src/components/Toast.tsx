import { useEffect, useState } from 'react';

type ToastProps = {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
};

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: { icon: 'fa-check-circle', bg: '#34C759' },
    error: { icon: 'fa-times-circle', bg: '#FF3B30' },
    info: { icon: 'fa-info-circle', bg: '#0A84FF' }
  };

  const { icon, bg } = config[type];

  return (
    <div 
      style={{
        position: 'fixed',
        top: 90,
        left: '50%',
        transform: `translateX(-50%) translateY(${isVisible ? 0 : -20}px)`,
        padding: '10px 16px',
        borderRadius: 10,
        background: bg,
        color: 'white',
        fontWeight: 500,
        fontSize: 13,
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.3s ease',
        opacity: isVisible ? 1 : 0,
        maxWidth: '90%',
        width: 'auto',
        pointerEvents: 'none', // ✅ NÃO BLOQUEIA CLIQUES
      }}
    >
      <i className={`fa-solid ${icon}`} style={{ fontSize: 14 }}></i>
      <span>{message}</span>
    </div>
  );
}
