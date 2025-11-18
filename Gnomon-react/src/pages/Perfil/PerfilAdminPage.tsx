// src/pages/Perfil/PerfilAdminPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import adminAvatar from '../../assets/Gnomon Logo _ SEM NOME.png';
import { RegisterEmployeePopup } from '../../components/RegisterEmployeePopup';
import './PerfilAdminPage.css';

interface UserData {
    id: number;
    name: string;
    email: string;
    createdAt: string;
    role: string;
    avatar?: string;
}

interface PerfilAdminPageProps {
    userData: UserData;
    handleLogout: () => void;
}

export function PerfilAdminPage({ userData, handleLogout }: PerfilAdminPageProps) {
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'registerEmployee', etc.

    const renderContent = () => {
        switch (activeView) {
            case 'registerEmployee':
                return (
                    <div className="content-card">
                        <RegisterEmployeePopup
                            isOpen={true}
                            onClose={() => setActiveView('dashboard')}
                            onRegisterSuccess={() => setActiveView('dashboard')}
                            isPopup={false} // Render as an embedded form
                        />
                    </div>
                );
            case 'dashboard':
            default:
                return (
                    <>
                        <div className="dashboard-welcome">
                            <h2>Bem-vindo, {userData.name}!</h2>
                            <p>Este é o seu centro de controle para todas as operações do Gnomon.</p>
                        </div>
                        <div className="stat-card-grid">
                            <Link to="/mapa" className="stat-card action-card">
                                <div className="stat-card-icon routes">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </div>
                                <div className="stat-card-info">
                                    <span className="stat-card-title">Criar Rota</span>
                                    <span className="action-card-desc">Ir para o mapa</span>
                                </div>
                            </Link>
                            <div className="stat-card">
                                <div className="stat-card-icon users">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                </div>
                                <div className="stat-card-info">
                                    <span className="stat-card-value">15</span>
                                    <span className="stat-card-title">Total de Usuários</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-icon locations">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                </div>
                                <div className="stat-card-info">
                                    <span className="stat-card-value">42</span>
                                    <span className="stat-card-title">Locais Cadastrados</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-icon admins">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.099a10 10 0 0 0-6.32 16.95l-2.12 2.12 1.41 1.41 2.12-2.12A10 10 0 1 0 12 2.099z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </div>
                                <div className="stat-card-info">
                                    <span className="stat-card-value">3</span>
                                    <span className="stat-card-title">Admins Ativos</span>
                                </div>
                            </div>
                        </div>
                        <div className="content-card" style={{ marginTop: '40px' }}>
                            <h3>Ações Rápidas</h3>
                            <p>Utilize o menu à esquerda para navegar entre as funcionalidades disponíveis.</p>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="admin-page-container">
            <aside className="admin-sidebar">
                <div className="admin-profile">
                    <img 
                        src={adminAvatar} 
                        alt="Foto do Admin" 
                        className="admin-profile-picture" 
                    />
                    <h2 className="admin-profile-name">{userData?.name}</h2>
                    <p className="admin-profile-email">{userData?.email}</p>
                </div>
                <nav className="admin-menu">
                    <ul>
                        <li>
                            <button 
                                onClick={() => setActiveView('dashboard')}
                                className={activeView === 'dashboard' ? 'active' : ''}
                            >
                                Dashboard
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => setActiveView('registerEmployee')}
                                className={activeView === 'registerEmployee' ? 'active' : ''}
                            >
                                Cadastrar Funcionário
                            </button>
                        </li>
                        {/* Futuras opções de gerenciamento podem ser adicionadas aqui */}
                        <li>
                            <button disabled>Gerenciar Usuários</button>
                        </li>
                        <li>
                            <button disabled>Ver Logs</button>
                        </li>
                    </ul>
                </nav>
                <div className="admin-sidebar-footer">
                    <Link to="/mapa" className="admin-back-link">
                        Voltar para o Mapa
                    </Link>
                    <button onClick={handleLogout} className="admin-logout-button">
                        Sair (Logout)
                    </button>
                </div>
            </aside>
            <main className="admin-main-content">
                {renderContent()}
            </main>
        </div>
    );
}