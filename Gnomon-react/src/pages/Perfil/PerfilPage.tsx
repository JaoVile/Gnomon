// src/pages/PerfilPage.tsx

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import placeholderAvatar from '../../assets/Gnomon Logo _ SEM NOME.png'; // Imagem de placeholder
import './PerfilPage.css';

// Interface atualizada para incluir a data de criação
interface UserData {
    id: number;
    name: string;
    email: string;
    createdAt: string; // O Prisma envia datas como strings no formato ISO
    avatar?: string;
}

export function PerfilPage() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('authToken');

            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch('http://localhost:3001/api/users/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Falha ao buscar dados do perfil. Faça o login novamente.');
                }

                const data = await response.json();
                setUserData({ ...data, avatar: placeholderAvatar });

            } catch (error) {
                console.error(error);
                localStorage.removeItem('authToken');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        console.log('Usuário deslogado');
        navigate('/');
    };

    if (loading) {
        return (
            <div className="profile-container">
                <div className="profile-card">
                    <h1>Carregando perfil...</h1>
                </div>
            </div>
        );
    }

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

                {/* ADICIONADO: Exibição da data de criação da conta */}
                <p className="profile-joindate">
                    Membro desde: {new Date(userData?.createdAt || '').toLocaleDateString('pt-BR')}
                </p>

                <div className="profile-actions">
                    <button onClick={handleLogout} className="logout-button">
                        Sair (Logout)
                    </button>
                    <Link to="/mapa" className="back-link">
                        Voltar para o Mapa
                    </Link>
                </div>
            </div>
        </div>
    );
}