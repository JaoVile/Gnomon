// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserData {
    id: number;
    name: string;
    email: string;
    createdAt: string;
    role: 'ADMIN' | 'STAFF';
    avatar?: string;
}

interface AuthState {
    user: UserData | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export function useAuth(): AuthState {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

            if (!token) {
                setIsLoading(false);
                setUser(null);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Falha ao buscar dados do perfil.');
                }

                const data: UserData = await response.json();
                setUser(data);

            } catch (err: any) {
                console.error('Erro de autenticação:', err);
                setError(err.message || 'Sessão inválida ou expirada.');
                // Limpar token inválido
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, [API_BASE_URL]);

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
    };
}
