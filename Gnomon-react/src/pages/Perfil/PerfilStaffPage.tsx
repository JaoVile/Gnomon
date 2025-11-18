// src/pages/Perfil/PerfilStaffPage.tsx

import { useState } from 'react'; // Importar useState
import { Link } from 'react-router-dom';
import placeholderAvatar from '../../assets/Gnomon Logo _ SEM NOME.png'; // Imagem de placeholder
import { RegisterEmployeePopup } from '../../components/RegisterEmployeePopup'; // Importar o popup
import './PerfilStaffPage.css'; // Atualizado para o novo nome

// Interface atualizada para incluir a data de criação e role
interface UserData {
    id: number;
    name: string;
    email: string;
    createdAt: string; // O Prisma envia datas como strings no formato ISO
    role: string; // Adicionado role
    avatar?: string;
}

interface PerfilStaffPageProps {
    userData: UserData;
    handleLogout: () => void;
}

export function PerfilStaffPage({ userData, handleLogout }: PerfilStaffPageProps) {
    const [isRegisterPopupOpen, setIsRegisterPopupOpen] = useState(false);

    const handleRegisterSuccess = () => {
        setIsRegisterPopupOpen(false);
        // Optionally, refresh user list or show a success message
    };

    return (
        <div className="profile-container">
            <div className="profile-card">
                <img 
                    src={userData?.avatar} 
                    alt="Foto do perfil" 
                    className="profile-picture" 
                />
                <h1 className="profile-name">{userData?.name}</h1>
                <p className="profile-email">{userData?.email}</p>

                <p className="profile-joindate">
                    Membro desde: {new Date(userData?.createdAt || '').toLocaleDateString('pt-BR')}
                </p>
                <p className="profile-role">
                    Cargo: {userData?.role}
                </p>

                <div className="profile-actions">
                    <button onClick={() => setIsRegisterPopupOpen(true)} className="register-employee-button">
                        Cadastrar Funcionário
                    </button>
                    <button onClick={handleLogout} className="logout-button">
                        Sair (Logout)
                    </button>
                    <Link to="/mapa" className="back-link">
                        Voltar para o Mapa
                    </Link>
                </div>
            </div>

            <RegisterEmployeePopup
                isOpen={isRegisterPopupOpen}
                onClose={() => setIsRegisterPopupOpen(false)}
                onRegisterSuccess={handleRegisterSuccess}
            />
        </div>
    );
}