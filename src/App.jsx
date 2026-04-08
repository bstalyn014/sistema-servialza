import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CortePage from './pages/CortePage';
import ReconexionPage from './pages/ReconexionPage';
import MantenimientoPage from './pages/MantenimientoPage';
import VerificacionPage from './pages/VerificacionPage';
import AnalisisPage from './pages/AnalisisPage';
import RendimientoPage from './pages/RendimientoPage';
import ResidencialPage from './pages/ResidencialPage';
import ComercialPage from './pages/ComercialPage';
import GeneracionOrdenesPage from './pages/GeneracionOrdenesPage';
import CalculoPREPage from './pages/CalculoPREPage';
import MapaOrdenesPage from './pages/MapaOrdenesPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/corte" element={<CortePage />} />
        <Route path="/reconexion" element={<ReconexionPage />} />
        <Route path="/verificacion" element={<VerificacionPage />} />
        <Route path="/mantenimiento" element={<MantenimientoPage />} />
        <Route path="/analisis" element={<AnalisisPage />} />
        <Route path="/generacion-ordenes" element={<GeneracionOrdenesPage />} />
        <Route path="/calculo-pre" element={<CalculoPREPage />} />
        <Route path="/mapa-ordenes" element={<MapaOrdenesPage />} />
        
        {/* Secondary Routes */}
        <Route path="/residencial" element={<ResidencialPage />} />
        <Route path="/comercial" element={<ComercialPage />} />
        <Route path="/rendimiento" element={<RendimientoPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
