// src/pages/EsqueceuSenhaPage.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoIcon from '../../assets/Gnomon Logo _ SEM NOME.png';
import './EsqueceuSenhaPage.css';

// Variável de ambiente para a URL da API, com um valor padrão para desenvolvimento local
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function EsqueceuSenhaPage() {
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    // Função handleSubmit atualizada para se comunicar com o back-end
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        
        try {
            // 1. Faz a requisição 'fetch' para o endpoint de recuperação de senha usando a API_URL
           const response = await fetch(`${API_URL}/api/users/forgot-password`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email }),
            });

            // 2. Converte a resposta do back-end
            const data = await response.json();

            // 3. Se a resposta da API não for de sucesso, lança um erro
            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro ao solicitar a recuperação.');
            }

            // 4. Se tudo deu certo, exibe a mensagem de sucesso vinda do back-end
            alert(data.message);
            
            // 5. Redireciona o usuário de volta para a página de login
            navigate('/login');

        } catch (error: any) {
            // 6. Captura e exibe qualquer erro para o usuário
            console.error('Erro ao solicitar recuperação:', error);
            alert(`Erro: ${error.message}`);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <Link to="/" className="logo-container">
                        <img src={logoIcon} alt="Ícone do Gnomon" />
                    </Link>
                    <h1>Recuperar Senha</h1>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <p style={{ textAlign: 'center', marginBottom: '25px', color: 'var(--cor-texto-secundario)' }}>
                        Sem problemas! Digite seu e-mail abaixo e enviaremos um link para você redefinir sua senha.
                    </p>

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

                    <button type="submit" className="cta-button login-button">
                        Enviar Link de Recuperação
                    </button>

                    <div className="signup-link">
                        <p>Lembrou a senha? <Link to="/login">Voltar para o Login</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
}