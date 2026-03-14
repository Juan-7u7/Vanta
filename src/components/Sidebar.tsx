import { useState, useEffect } from 'react';
import { 
  Menu, X, ChevronDown, CircleDollarSign, 
  TrendingUp, Settings, FileText, Bell, LogOut
} from 'lucide-react';

const MODULES = [
  {
    title: 'Módulo de compensaciones',
    icon: CircleDollarSign,
    options: [
      { name: 'Colaboradores' },
      { name: 'Indicadores' },
      { name: 'Salarios' },
      { name: 'Alcance' },
      { name: 'Comisiones Directas' },
      { name: 'Otros Ingresos' },
    ],
  },
  {
    title: "Manejo de KPI's",
    icon: TrendingUp,
    options: [
      { name: 'Opción no disponible', disabled: true },
    ],
  },
  {
    title: 'Configuración del sistema',
    icon: Settings,
    options: [
      { name: 'Unidad de Negocio' },
      { name: 'Perfiles' },
      { name: 'Usuarios' },
      { name: 'Bonos' },
      { name: 'Carga Masiva de Datos' },
    ],
  },
  {
    title: 'Consulta de reportes',
    icon: FileText,
    options: [
      { name: 'COVAS' },
      { name: 'Libro 2026' },
    ],
  },
];

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobile = () => {
    if (isMobile) setIsOpen(!isOpen);
  };

  const toggleSubmenu = (title: string, e: React.MouseEvent) => {
    e.preventDefault();
    setOpenMenus(prev => ({
      [title]: !prev[title]
    }));
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <button 
          onClick={toggleMobile}
          className="fixed top-4 left-4 z-[60] p-3 rounded-2xl bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-200 shadow-xl transition-colors hover:bg-white/30 dark:hover:bg-black/40"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleMobile}
        />
      )}

      {/* Glassmorphism Sidebar Container */}
      <aside 
        onMouseLeave={() => !isMobile && setOpenMenus({})}
        className={`fixed top-0 lg:top-4 bottom-0 lg:bottom-4 z-50 transition-all duration-[400ms] ease-out flex flex-col
          ${isMobile ? (isOpen ? 'left-0 w-[300px]' : '-left-full w-[300px]') : 'left-4 w-[80px] hover:w-[320px] group'}
          bg-white/15 dark:bg-black/25 backdrop-blur-2xl border border-white/30 dark:border-white/10 
          shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]
          ${isMobile ? 'rounded-r-3xl' : 'rounded-[32px] overflow-hidden'}
        `}
      >
        {/* Header / Logo */}
        <div className={`flex items-center h-28 shrink-0 transition-all duration-300 ${isMobile ? 'px-6 mt-16' : 'w-full justify-center group-hover:justify-start group-hover:px-6'}`}>
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg relative group-hover:w-10 group-hover:h-10 transition-all duration-300">
             <span className="text-white font-bold text-2xl group-hover:text-xl transition-all">V</span>
          </div>
          <h1 
            className={`whitespace-nowrap text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-300 transition-all duration-300 ${isMobile ? 'opacity-100 ml-4' : 'w-0 opacity-0 overflow-hidden group-hover:w-auto group-hover:opacity-100 group-hover:ml-4 group-hover:delay-100'}`}
          >
            Vanta Media
          </h1>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-6 flex flex-col mt-4">
          <ul className="space-y-3 flex flex-col items-center group-hover:items-stretch lg:px-2 flex-grow">
            {MODULES.map((module, mIdx) => {
              const isOpenMenu = openMenus[module.title];
              return (
                <li key={mIdx} className="relative w-full sidebar-tooltip-container">
                  <button 
                    onClick={(e) => toggleSubmenu(module.title, e)}
                    className={`flex items-center justify-between p-3 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-white hover:shadow-sm transition-all duration-200 ${isMobile ? 'w-full' : 'w-12 group-hover:w-full'} outline-none`}
                  >
                    <div className={`flex items-center ${isMobile ? 'w-full' : 'justify-center group-hover:justify-start'}`}>
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                        <module.icon size={22} strokeWidth={1.5} />
                      </div>
                      <span className={`ml-4 text-[15px] text-left font-medium whitespace-nowrap transition-all duration-300 ${isMobile ? 'opacity-100' : 'w-0 opacity-0 overflow-hidden group-hover:w-auto group-hover:opacity-100 group-hover:delay-100'}`}>
                        {module.title}
                      </span>
                    </div>
                    {/* Arrow Icon */}
                    <div className={`flex-shrink-0 transition-all duration-300 ${isMobile ? 'opacity-100' : 'w-0 opacity-0 overflow-hidden group-hover:w-auto group-hover:opacity-100'}`}>
                      <ChevronDown size={18} className={`transition-transform duration-300 ${isOpenMenu ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Submenu Drawer */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out w-full ${isOpenMenu ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'} ${!isMobile ? 'group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none' : ''}`}
                  >
                    {/* Force hide submenu when sidebar is collapsed in desktop to prevent glitches */}
                    <div className={`transition-all duration-300 ${!isMobile ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                      <ul className="ml-[18px] pl-6 py-2 border-l border-gray-300 dark:border-gray-700/50 space-y-1">
                        {module.options.map((opt, iIdx) => (
                          <li key={iIdx}>
                            <a 
                              href="#" 
                              className={`block py-2 px-3 rounded-xl text-sm transition-colors ${'disabled' in opt && opt.disabled ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'}`}
                              onClick={e => ('disabled' in opt && opt.disabled) && e.preventDefault()}
                            >
                              {opt.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Cool Minimal Tooltip (Desktop only, visible when Sidebar is collapsed) */}
                  {!isMobile && (
                    <div className="sidebar-tooltip absolute left-[calc(100%+20px)] top-1/2 -translate-y-1/2 px-4 py-2 bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/40 dark:border-white/10 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-xl opacity-0 invisible pointer-events-none transition-all duration-300 z-50 shadow-xl whitespace-nowrap flex items-center group-hover/aside:hidden">
                      {module.title}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Bottom Actions (Notifications & Logout) */}
          <div className={`mt-auto pt-6 pb-2 border-t border-gray-300/50 dark:border-gray-700/50 flex flex-col items-center lg:items-start group-hover:items-stretch lg:px-2 transition-all duration-300 ${isMobile ? 'opacity-100' : 'group-hover:opacity-100'}`}>
            <div className="relative w-full sidebar-tooltip-container mb-1">
              <button 
                onClick={() => setShowAlerts(true)}
                className={`flex items-center justify-center lg:justify-start w-full p-3 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-white hover:shadow-sm transition-all duration-200 outline-none ${isMobile ? 'justify-start' : 'group-hover:justify-start'}`}
              >
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <Bell size={22} strokeWidth={1.5} />
                </div>
                <span className={`ml-4 text-[15px] font-medium whitespace-nowrap transition-all duration-300 ${isMobile ? 'opacity-100' : 'w-0 opacity-0 overflow-hidden group-hover:w-auto group-hover:opacity-100 group-hover:delay-100'}`}>
                  Alertas
                </span>
              </button>
              
              {/* Tooltip for Alertas */}
              {!isMobile && (
                <div className="sidebar-tooltip absolute left-[calc(100%+20px)] top-1/2 -translate-y-1/2 px-4 py-2 bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/40 dark:border-white/10 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-xl opacity-0 invisible pointer-events-none transition-all duration-300 z-50 shadow-xl whitespace-nowrap flex items-center group-hover/aside:hidden">
                  Alertas
                </div>
              )}
            </div>

            <div className="relative w-full sidebar-tooltip-container">
              <button 
                onClick={onLogout}
                className={`flex items-center justify-center lg:justify-start w-full p-3 rounded-2xl text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 transition-all duration-200 outline-none ${isMobile ? 'justify-start' : 'group-hover:justify-start'}`}
              >
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <LogOut size={22} strokeWidth={1.5} />
                </div>
                <span className={`ml-4 text-[15px] font-medium whitespace-nowrap transition-all duration-300 ${isMobile ? 'opacity-100' : 'w-0 opacity-0 overflow-hidden group-hover:w-auto group-hover:opacity-100 group-hover:delay-100'}`}>
                  Cerrar sesión
                </span>
              </button>

              {/* Tooltip for Cerrar sesión */}
              {!isMobile && (
                <div className="sidebar-tooltip absolute left-[calc(100%+20px)] top-1/2 -translate-y-1/2 px-4 py-2 bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/40 dark:border-white/10 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-xl opacity-0 invisible pointer-events-none transition-all duration-300 z-50 shadow-xl whitespace-nowrap flex items-center group-hover/aside:hidden">
                  Cerrar sesión
                </div>
              )}
            </div>
          </div>
        </nav>
      </aside>

      {/* Alertas Modal */}
      {showAlerts && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-md"
            onClick={() => setShowAlerts(false)}
          />
          <div className="relative w-full max-w-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-feedback">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Alertas</h3>
                </div>
                <button 
                  onClick={() => setShowAlerts(false)}
                  className="p-2 rounded-xl hovr:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay alertas</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Te avisaremos cuando haya algo nuevo.</p>
              </div>
              
              <button 
                onClick={() => setShowAlerts(false)}
                className="w-full py-3.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white font-bold rounded-2xl transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
