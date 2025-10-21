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