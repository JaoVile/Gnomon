// src/pages/Perfil/PerfilWrapper.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PerfilAdminPage } from './PerfilAdminPage';
import { PerfilStaffPage } from './PerfilStaffPage';

// Estilos genéricos para telas de carregamento/erro podem ser movidos para um CSS global se necessário
const loadingErrorStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--background)',
    color: 'var(--text)',
};

export function PerfilWrapper() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading, error } = useAuth();

    useEffect(() => {
        // Se não está carregando e não está autenticado, redireciona para o login
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isLoading, isAuthenticated, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        console.log('Usuário deslogado');
        navigate('/');
        // Forçar o hook a reavaliar, embora o redirecionamento já resolva
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div style={loadingErrorStyles}>
                <h1>Carregando perfil...</h1>
            </div>
        );
    }

    if (error) {
        return (
            <div style={loadingErrorStyles}>
                <div>
                    <h1>Erro ao carregar perfil</h1>
                    <p>{error}</p>
                    <button onClick={() => navigate('/login')} style={{ padding: '10px 20px' }}>
                        Ir para Login
                    </button>
                </div>
            </div>
        );
    }

    if (isAuthenticated && user) {
        // Renderiza o componente de perfil apropriado com base na role
        if (user.role === 'ADMIN') {
            return <PerfilAdminPage userData={user} handleLogout={handleLogout} />;
        } else {
            // Assumimos que qualquer outra role é um "staff" ou usuário normal
            return <PerfilStaffPage userData={user} handleLogout={handleLogout} />;
        }
    }

    // Renderiza nulo ou uma tela de "Redirecionando..." enquanto o useEffect faz o seu trabalho
    return null;
}
