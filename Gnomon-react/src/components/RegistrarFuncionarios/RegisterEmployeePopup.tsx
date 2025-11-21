// src/components/RegisterEmployeePopup.tsx

import { useState, useEffect } from 'react';
import './RegisterEmployeePopup.css';

interface RegisterEmployeePopupProps {
    isOpen: boolean;
    onClose: () => void;
    onRegisterSuccess: () => void;
    isPopup?: boolean; // true para modal, false para formulário embutido
}

export function RegisterEmployeePopup({ 
    isOpen, 
    onClose, 
    onRegisterSuccess, 
    isPopup = true 
}: RegisterEmployeePopupProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('STAFF');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

    // Limpa o formulário e as mensagens quando o popup é fechado ou a view é trocada
    useEffect(() => {
        if (!isOpen) {
            setName('');
            setEmail('');
            setPassword('');
            setRole('STAFF');
            setError('');
            setSuccessMessage('');
        }
    }, [isOpen]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (!token) {
            setError('Você não está autenticado.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register-staff`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name, email, password, role }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Falha ao cadastrar funcionário.');
            }

            setSuccessMessage('Funcionário cadastrado com sucesso! Redirecionando...');
            
            // Limpa o formulário
            setName('');
            setEmail('');
            setPassword('');
            setRole('STAFF');

            // Notifica o componente pai e fecha/redireciona após um delay
            setTimeout(() => {
                onRegisterSuccess();
            }, 2000);

        } catch (err: any) {
            console.error('Erro ao cadastrar funcionário:', err);
            setError(err.message || 'Erro desconhecido ao cadastrar funcionário.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const FormContent = (
        <form onSubmit={handleSubmit}>
            <div className="input-group">
                <label htmlFor="employee-name">Nome</label>
                <input
                    type="text"
                    id="employee-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div className="input-group">
                <label htmlFor="employee-email">E-mail</label>
                <input
                    type="email"
                    id="employee-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="input-group">
                <label htmlFor="employee-password">Senha</label>
                <input
                    type="password"
                    id="employee-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <div className="input-group">
                <label htmlFor="employee-role">Cargo</label>
                <select
                    id="employee-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                >
                    <option value="STAFF">Funcionário</option>
                </select>
            </div>
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
        </form>
    );

    if (isPopup) {
        return (
            <div className="register-employee-popup-overlay">
                <div className="register-employee-popup-content">
                    <div className="popup-header">
                        <h2>Cadastrar Novo Funcionário</h2>
                        <button onClick={onClose} className="close-btn">
                            &times;
                        </button>
                    </div>
                    {FormContent}
                </div>
            </div>
        );
    }

    // Renderiza como um formulário embutido
    return (
        <div className="register-employee-form-container">
            <div className="popup-header">
                <h2>Cadastrar Novo Funcionário</h2>
            </div>
            {FormContent}
        </div>
    );
}
