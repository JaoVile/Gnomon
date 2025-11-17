/**
 * @file LoginPage.tsx
 * @description Componente de página para autenticação de usuários.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoIcon from '../../assets/Gnomon Logo _ SEM NOME.png';
import './LoginPage.css'; 

export function LoginPage() {
    // Estados para controlar os campos do formulário
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Estados para controlar o feedback da UI
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    /**
     * Manipula a submissão do formulário de login, enviando os dados para a API
     * e tratando a resposta.
     * @param {React.FormEvent} event - O evento de submissão do formulário.
     */
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true); // Inicia o estado de carregamento
        setError(''); // Limpa erros anteriores

        const loginData = { email, password };

        try {
            const response = await fetch('http://localhost:3001/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Falha ao fazer login.');
            }
            
            localStorage.setItem('authToken', responseData.token);
            navigate('/mapa');

        } catch (error: unknown) {
            console.error('Erro no login:', error);
            // Define a mensagem de erro para ser exibida na tela
            setError(error.message);
        } finally {
            // Garante que o estado de carregamento termine, mesmo se houver erro
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <Link to="/" className="logo-container">
                        <img src={logoIcon} alt="Ícone do Gnomon" />
                    </Link>
                    <h1>Acessar Plataforma</h1>
                </div>
                
                <form onSubmit={handleSubmit}>
                    {/* Campos de input (sem alteração na estrutura) */}
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <i className="fas fa-envelope input-icon"></i>
                        <input 
                            type="email" 
                            id="email" 
                            placeholder="seuemail@exemplo.com" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Senha</label>
                        <i className="fas fa-lock input-icon"></i>
                        <input 
                            type={showPassword ? 'text' : 'password'}
                            id="password" 
                            placeholder="Sua senha" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <i 
                            className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle-icon`}
                            onClick={() => setShowPassword(!showPassword)}
                        ></i>
                    </div>
                    <div className="options-group">
                        <div className="remember-me">
                            <input type="checkbox" id="remember" name="remember" />
                            <label htmlFor="remember">Lembrar-me</label>
                        </div>
                        <Link to="/esqueceu-senha">Esqueceu a senha?</Link>
                    </div>

                    {/* Renderização condicional da mensagem de erro */}
                    {error && <p className="error-message">{error}</p>}

                    {/* Botão com estado de carregamento */}
                    <button type="submit" className="cta-button login-button" disabled={isLoading}>
                        {isLoading ? 'Entrando...' : 'Entrar'}
                    </button>

                </form>
            </div>
        </div>
    );
}