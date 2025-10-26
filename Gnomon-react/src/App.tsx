import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import HomePage from './pages/Intro/Intro'
import MapaPage from './pages/Mapa/MapaPage'
import LoginPage from './pages/Login/LoginPage' // usaremos como /config (Staff/Admin)

export default function App() {
return (
<BrowserRouter>
<Routes>
{/* Público */}
<Route path="/" element={<HomePage />} />
<Route path="/mapa" element={<MapaPage />} />


    {/* Configurações (login Staff/Admin) */}
    <Route path="/config" element={<LoginPage />} />

    {/* Rotas antigas -> redirecionar (removendo cadastro/login do público) */}
    <Route path="/login" element={<Navigate to="/config" replace />} />
    <Route path="/cadastro" element={<Navigate to="/mapa" replace />} />
    <Route path="/perfil" element={<Navigate to="/mapa" replace />} />
    <Route path="/esqueceu-senha" element={<Navigate to="/config" replace />} />
    <Route path="/RedefinirSenha" element={<Navigate to="/config" replace />} />
    <Route path="/reset-password" element={<Navigate to="/config" replace />} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
)
}
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/Intro/Intro';
import LoginPage from './pages/Login/LoginPage';
import CadastroPage from './pages/Cadastro/CadastroPage';
import MapaPage from './pages/Mapa/MapaPage';
import PerfilPage from './pages/Perfil/PerfilPage';
import EsqueceuSenhaPage from './pages/EsqueceuSenha/EsqueceuSenhaPage';
import RedefinirSenhaPage from './pages/RedefinirSenha/RedefinirSenha';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/mapa" element={<MapaPage />} />
        <Route path="/perfil" element={<PerfilPage />} />

        {/* Esqueci a senha */}
        <Route path="/esqueceu-senha" element={<EsqueceuSenhaPage />} />

        {/* Redefinir senha (dois caminhos válidos) */}
        <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
        <Route path="/reset-password" element={<RedefinirSenhaPage />} />

        {/* Compat: redireciona o caminho antigo com maiúscula */}
        <Route path="/RedefinirSenha" element={<Navigate to="/redefinir-senha" replace />} />

        {/* 404 opcional */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
