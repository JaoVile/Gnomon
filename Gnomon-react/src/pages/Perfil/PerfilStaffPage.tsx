// src/pages/Perfil/PerfilStaffPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import staffAvatar from '../../assets/Gnomon Logo _ SEM NOME.png';
import './PerfilStaffPage.css';

interface UserData {
    id: number;
    name: string;
    email: string;
    createdAt: string;
    role: string;
    avatar?: string;
}

interface PerfilStaffPageProps {
    userData: UserData;
    handleLogout: () => void;
}

export function PerfilStaffPage({ userData, handleLogout }: PerfilStaffPageProps) {
    const [activeView, setActiveView] = useState('info'); // 'info' or 'logs'

    const renderContent = () => {
        switch (activeView) {
            case 'logs':
                return (
                    <div className="content-card">
                        <h3>Meus Logs de Atividade</h3>
                        <p>Esta área registrará suas atividades importantes no sistema, como rotas criadas e locais favoritados.</p>
                        <div className="logs-placeholder">
                            <i className="fa-solid fa-person-digging"></i>
                            <span>Funcionalidade em desenvolvimento.</span>
                        </div>
                    </div>
                );
            case 'info':
            default:
                return (
                    <>
                        <div className="content-card staff-info-card">
                            <h3>Minhas Informações</h3>
                            <div className="staff-details">
                                <div>
                                    <p><strong>Nome:</strong> {userData.name}</p>
                                    <p><strong>Email:</strong> {userData.email}</p>
                                    <p><strong>Cargo:</strong> {userData.role}</p>
                                    <p><strong>Membro desde:</strong> {new Date(userData.createdAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="content-card">
                            <h3>Ações Rápidas</h3>
                             <div className="action-card-grid">
                                <Link to="/mapa" className="action-card">
                                    <div className="action-card-icon map">
                                        <i className="fa-solid fa-map-location-dot"></i>
                                    </div>
                                    <div className="action-card-info">
                                        <span className="action-card-title">Navegar no Mapa</span>
                                        <span className="action-card-desc">Acessar o mapa interativo do campus.</span>
                                    </div>
                                </Link>
                                <div className="action-card disabled">
                                    <div className="action-card-icon history">
                                        <i className="fa-solid fa-clock-rotate-left"></i>
                                    </div>
                                    <div className="action-card-info">
                                        <span className="action-card-title">Meu Histórico</span>
                                        <span className="action-card-desc">Ver suas rotas recentes (em breve).</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="staff-page-container">
            <aside className="staff-sidebar">
                <div className="staff-profile">
                    <img 
                        src={userData.avatar || staffAvatar} 
                        alt="Foto do Perfil" 
                        className="staff-profile-picture" 
                    />
                    <h2 className="staff-profile-name">{userData?.name}</h2>
                </div>
                <nav className="staff-menu">
                    <ul>
                        <li>
                            <button 
                                onClick={() => setActiveView('info')}
                                className={activeView === 'info' ? 'active' : ''}
                            >
                                <i className="fa-solid fa-user"></i>
                                <span>Minhas Informações</span>
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => setActiveView('logs')}
                                className={activeView === 'logs' ? 'active' : ''}
                            >
                                <i className="fa-solid fa-list-check"></i>
                                <span>Meus Logs</span>
                            </button>
                        </li>
                    </ul>
                </nav>
                <div className="staff-sidebar-footer">
                    <Link to="/mapa" className="staff-back-link">
                        <i className="fa-solid fa-map"></i>
                        <span>Voltar para o Mapa</span>
                    </Link>
                    <button onClick={handleLogout} className="staff-logout-button">
                        <i className="fa-solid fa-right-from-bracket"></i>
                        <span>Sair (Logout)</span>
                    </button>
                </div>
            </aside>
            <main className="staff-main-content">
                <header className="staff-header">
                    <h1>Portal do Funcionário</h1>
                    <p>Gerencie suas informações e acesse as funcionalidades do Gnomon.</p>
                </header>
                {renderContent()}
            </main>
        </div>
    );
}