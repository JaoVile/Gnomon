/// <reference lib="dom" />
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import logoIcon from '../../assets/Gnomon Logo _ SEM NOME.png';
import './RedefinirSenha.css';

// --- CORREÇÃO DE AMBIENTE ---
// Força o TypeScript a aceitar variáveis globais do navegador
declare const window: any;
declare const alert: any;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function RedefinirSenha() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // O 'navigate' será usado após o sucesso da requisição
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    if (!token || !email) {
      setError('Link inválido ou incompleto. Solicite um novo link.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem!');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, email }),
      });

      const data: any = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Falha ao redefinir a senha.');

      // Sucesso: usa window.alert e depois navigate
      if (typeof window !== 'undefined') {
        window.alert('Senha redefinida com sucesso! Você já pode fazer o login.');
      } else {
        alert('Senha redefinida com sucesso!');
      }
      
      navigate('/login'); // Aqui removemos o erro de "unused variable"

    } catch (e: any) {
      console.error('Erro ao redefinir senha:', e);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <h1>Token Inválido ou Expirado</h1>
          <p style={{ margin: '20px 0' }}>O link de redefinição é inválido ou já expirou.</p>
          <Link to="/esqueceu-senha" className="cta-button">Solicitar um novo link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Link to="/" className="logo-container">
            <img src={logoIcon} alt="Ícone do Gnomon" />
          </Link>
          <h1>Redefinir Senha</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <p style={{ textAlign: 'center', marginBottom: '25px', color: 'var(--cor-texto-secundario)' }}>
            Digite sua nova senha abaixo.
          </p>

          <div className="input-group">
            <label htmlFor="password">Nova Senha</label>
            <i className="fas fa-lock input-icon"></i>
            <input
              type="password"
              id="password"
              placeholder="Mínimo de 6 caracteres"
              required
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirm-password">Confirme a Nova Senha</label>
            <i className="fas fa-lock input-icon"></i>
            <input
              type="password"
              id="confirm-password"
              placeholder="Repita a nova senha"
              required
              value={confirmPassword}
              onChange={(e: any) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="cta-button login-button" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}