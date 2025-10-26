// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/Intro/Intro';
import MapaPage from './pages/Mapa/MapaPage';
import LoginPage from './pages/Login/LoginPage';
import CadastroPage from './pages/Cadastro/CadastroPage';
import PerfilPage from './pages/Perfil/PerfilPage';
import EsqueceuSenhaPage from './pages/EsqueceuSenha/EsqueceuSenhaPage';
import RedefinirSenhaPage from './pages/RedefinirSenha/RedefinirSenha';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Público */}
        <Route path="/" element={<HomePage />} />
        <Route path="/mapa" element={<MapaPage />} />

        {/* Autenticação / Perfil */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/config" element={<LoginPage />} /> {/* alias para Staff/Admin */}
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/perfil" element={<PerfilPage />} />

        {/* Recuperação de senha */}
        <Route path="/esqueceu-senha" element={<EsqueceuSenhaPage />} />
        <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
        <Route path="/reset-password" element={<RedefinirSenhaPage />} />
        <Route path="/RedefinirSenha" element={<Navigate to="/redefinir-senha" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}