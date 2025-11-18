import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ========================================
// PÁGINAS PÚBLICAS
// ========================================
import { Intro as HomePage } from './pages/Intro/Intro';
import { MapaPage } from './pages/Mapa/MapaPage';
import { AjudaPage } from './pages/Ajuda/AjudaPage';

// ========================================
// AUTENTICAÇÃO E PERFIL (Admin/Staff)
// ========================================
import { LoginPage } from './pages/Login/LoginPage';
import { PerfilWrapper as PerfilPage } from './pages/Perfil/PerfilWrapper';
import { EsqueceuSenhaPage } from './pages/EsqueceuSenha/EsqueceuSenhaPage';
import { RedefinirSenha as RedefinirSenhaPage } from './pages/RedefinirSenha/RedefinirSenha';
import { ConfigPage } from './pages/Configuracoes/ConfigPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================
            ROTAS PÚBLICAS
        ======================================== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/mapa" element={<MapaPage />} />
        <Route path="/ajuda" element={<AjudaPage />} />

        {/* ========================================
            AUTENTICAÇÃO (Admin/Staff)
        ======================================== */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* ========================================
            PERFIL (Requer Login)
        ======================================== */}
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/configuracoes" element={<ConfigPage />} />

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