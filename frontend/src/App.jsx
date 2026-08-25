import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import MintPage from './pages/MintPage'
import GalleryPage from './pages/GalleryPage'
import TokenPage from './pages/TokenPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/mint" element={<MintPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/gallery/token/:tokenId" element={<TokenPage />} />
      </Routes>
    </BrowserRouter>
  )
}
