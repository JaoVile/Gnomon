import { Route, Routes } from 'react-router-dom';
import { Intro } from './pages/Intro/Intro';
import { LoginPage } from './pages/Login/LoginPage';
import { EsqueceuSenhaPage } from './pages/EsqueceuSenha/EsqueceuSenhaPage';
import { RedefinirSenha } from './pages/RedefinirSenha/RedefinirSenha';
import { MapaPage } from './pages/Mapa/MapaPage';
import { PerfilWrapper } from './pages/Perfil/PerfilWrapper'; // Importa o PerfilWrapper
import { ConfigPage } from './pages/Configuracoes/ConfigPage';
import { AjudaPage } from './pages/Ajuda/AjudaPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Intro />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueceu-senha" element={<EsqueceuSenhaPage />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/mapa" element={<MapaPage />} />
      <Route path="/perfil" element={<PerfilWrapper />} /> {/* Usa o PerfilWrapper */}
      <Route path="/configuracoes" element={<ConfigPage />} />
      <Route path="/ajuda" element={<AjudaPage />} />
    </Routes>
  );
}
