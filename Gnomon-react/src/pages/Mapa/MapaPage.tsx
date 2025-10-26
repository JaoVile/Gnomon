// src/pages/Mapa/MapaPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../../assets/Gnomon Logo _ SEM NOME.png';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Campus3D from '../../components/Campus3d';
import { useThemeVars } from '../../libs/useThemeVars';
import './MapaPage.css';

export default function MapaPage() {
  const [activeNav, setActiveNav] = useState('Mapa');
  const [mode, setMode] = useState<'2d' | '3d'>('3d');
  const [topDown] = useState(false);

  const { routePrimary } = useThemeVars();

  const position: [number, number] = [-8.302728, -35.991291];

  // Exemplo de rota mock 2D
  const mockPath: LatLngExpression[] = [
    [-8.3029, -35.9916],
    [-8.3027, -35.9913],
    [-8.3025, -35.9911],
  ];

  const styleMain = { color: routePrimary, weight: 7, opacity: 0.95 };

  return (
    <div id="map-app-container">
      <header className="top-bar">
        <i className="fa-solid fa-bars menu-icon"></i>
        <Link to="/" className="logo-container">
          <img src={logoIcon} alt="Ícone Gnomon" />
          <span>GNOMON</span>
        </Link>
        <Link to="/config">
          <i className="fa-solid fa-gear profile-icon"></i>
        </Link>
      </header>

      <main className="content-area">
        <div className="search-bar">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input type="search" placeholder="Buscar local, sala ou serviço..." />
          <div className="view-toggle">
            <button className={mode === '2d' ? 'active' : ''} onClick={() => setMode('2d')}>2D</button>
            <button className={mode === '3d' ? 'active' : ''} onClick={() => setMode('3d')}>3D</button>
          </div>
        </div>

        <div id="map-container">
          {mode === '3d' ? (
            <Campus3D url="/models/Campus.glb" topDown={topDown} />
          ) : (
            <MapContainer center={position} zoom={18} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position}>
                <Popup>
                  <b>Ponto Central do Campus</b> <br /> Entrada do Campus da Uninassau.
                </Popup>
              </Marker>

              {/* Rota principal (exemplo) */}
              <Polyline positions={mockPath} pathOptions={styleMain} />
            </MapContainer>
          )}
        </div>
      </main>

      <footer className="bottom-nav">
        <div className={`nav-item ${activeNav === 'Mapa' ? 'active' : ''}`} onClick={() => setActiveNav('Mapa')}>
          <i className="fa-solid fa-map-location-dot"></i>
          <span>Mapa</span>
        </div>
        <div className={`nav-item ${activeNav === 'Locais' ? 'active' : ''}`} onClick={() => setActiveNav('Locais')}>
          <i className="fa-solid fa-list-ul"></i>
          <span>Locais</span>
        </div>
        <div className={`nav-item ${activeNav === 'Favoritos' ? 'active' : ''}`} onClick={() => setActiveNav('Favoritos')}>
          <i className="fa-solid fa-star"></i>
          <span>Favoritos</span>
        </div>
        <div className={`nav-item ${activeNav === 'Ajustes' ? 'active' : ''}`} onClick={() => setActiveNav('Ajustes')}>
          <i className="fa-solid fa-gear"></i>
          <span>Ajustes</span>
        </div>
      </footer>
    </div>
  );
}