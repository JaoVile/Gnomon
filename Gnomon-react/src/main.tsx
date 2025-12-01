import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/Theme/ThemeContext.tsx';
import { MapProvider } from './contexts/MapContext.tsx';
import { MapSettingsProvider } from './contexts/MapSettingsContext.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <ThemeProvider>
        <MapSettingsProvider>
          <MapProvider>
            <App />
          </MapProvider>
        </MapSettingsProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  // </StrictMode>
);