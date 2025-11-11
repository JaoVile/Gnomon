import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ========================================
// PÁGINAS PÚBLICAS
// ========================================
import HomePage from './pages/Intro/Intro';
import MapaPage from './pages/Mapa/MapaPage';

// ========================================
// AUTENTICAÇÃO E PERFIL (Admin/Staff)
// ========================================
import LoginPage from './pages/Login/LoginPage';
import PerfilPage from './pages/Perfil/PerfilPage';
import EsqueceuSenhaPage from './pages/EsqueceuSenha/EsqueceuSenhaPage';
import RedefinirSenhaPage from './pages/RedefinirSenha/RedefinirSenha';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================
            ROTAS PÚBLICAS
        ======================================== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/mapa" element={<MapaPage />} />

        {/* ========================================
            AUTENTICAÇÃO (Admin/Staff)
        ======================================== */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/config" element={<LoginPage />} /> {/* Alias para Staff/Admin */}
        
        {/* ========================================
            PERFIL (Requer Login)
        ======================================== */}
        <Route path="/perfil" element={<PerfilPage />} />

        {/* ========================================
            RECUPERAÇÃO DE SENHA
        ======================================== */}
        <Route path="/esqueceu-senha" element={<EsqueceuSenhaPage />} />
        <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
        
        {/* Redirect em inglês (links de e-mail) */}
        <Route path="/reset-password" element={<RedefinirSenhaPage />} />

        {/* ========================================
            REDIRECTS (Corrigir URLs antigas)
        ======================================== */}
        {/* Case incorreto → Case correto */}
        <Route path="/RedefinirSenha" element={<Navigate to="/redefinir-senha" replace />} />
        
        {/* ========================================
            FALLBACK (404 → Home)
        ======================================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}