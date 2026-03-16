import { useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Colaboradores from './Colaboradores';
import Indicadores from './Indicadores';
import Salarios from './Salarios';
import Alcance from './Alcance';
import ComisionesDirectas from './ComisionesDirectas';
import OtrosIngresos from './OtrosIngresos';
import UnidadesNegocio from './UnidadesNegocio';
import PerfilesSeguridad from './PerfilesSeguridad';
import Usuarios from './Usuarios';
import Bonos from './Bonos';
import CargaMasiva from './CargaMasiva';
import ImprimirCovas from './ImprimirCovas';

export default function Dashboard() {
  const { signOut } = useAuth();

  useEffect(() => {
    document.title = 'Avanta Media - Panel de Control';
  }, []);

  return (
    <div className="min-h-screen relative z-0 flex">
      <Sidebar onLogout={signOut} />
      <main className="flex-1 min-w-0 overflow-x-hidden transition-all duration-[400ms] lg:pl-[120px] pt-20 px-4 pb-6 lg:pt-10 lg:px-10 lg:pb-10">
        <Routes>
          <Route path="colaboradores" element={<Colaboradores />} />
          <Route path="indicadores" element={<Indicadores />} />
          <Route path="salarios" element={<Salarios />} />
          <Route path="alcance" element={<Alcance />} />
          <Route path="comisiones-directas" element={<ComisionesDirectas />} />
          <Route path="otros-ingresos" element={<OtrosIngresos />} />
          <Route path="unidad-negocio" element={<UnidadesNegocio />} />
          <Route path="perfiles" element={<PerfilesSeguridad />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="bonos" element={<Bonos />} />
          <Route path="carga-masiva" element={<CargaMasiva />} />
          <Route path="covas" element={<ImprimirCovas />} />
          <Route path="/" element={
            <div className="flex items-center justify-center h-full">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Bienvenido al Panel de Control</h1>
            </div>
          } />
        </Routes>
        <Outlet />
      </main>
    </div>
  );
}
