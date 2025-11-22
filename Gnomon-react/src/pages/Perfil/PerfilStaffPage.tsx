// src/pages/Perfil/PerfilStaffPage.tsx
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
    return (
        <div className="staff-page-container">
            <header className="staff-header">
                <h1>Bem-vindo(a), {userData.name}!</h1>
                <p>Aqui você pode acessar rapidamente as funcionalidades do Gnomon.</p>
            </header>

            <div className="staff-content">
                <div className="content-card staff-info-card">
                    <h3>Suas Informações</h3>
                    <div className="staff-details">
                        <img src={userData.avatar || staffAvatar} alt="Avatar" className="staff-avatar" />
                        <div>
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

                <div className="staff-footer-actions">
                     <button onClick={handleLogout} className="logout-button">
                        <i className="fa-solid fa-right-from-bracket"></i>
                        <span>Sair (Logout)</span>
                    </button>
                </div>
            </div>
        </div>
    );
}