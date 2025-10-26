import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'

const updateSW = registerSW({
immediate: true,
onNeedRefresh() {
if (confirm('Nova versão disponível. Atualizar agora?')) {
updateSW(true)
}
},
onOfflineReady() {
console.log('App pronto para uso offline.')
},
})

createRoot(document.getElementById('root')!).render(
<StrictMode>
<App />
</StrictMode>
)