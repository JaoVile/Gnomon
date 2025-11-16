import { Link } from 'react-router-dom';
import type { CSSProperties, ReactNode } from 'react'; // ✅ CORRIGIDO

interface CtaButtonProps {
  to: string;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export default function CtaButton({ 
  to, 
  children, 
  style, 
  className = '',
  onClick 
}: CtaButtonProps) {
  return (
    <Link 
      to={to} 
      className={`cta-button ${className}`.trim()}
      style={style}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}