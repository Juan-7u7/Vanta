import { useState, useEffect } from 'react';
import { 
  Home, BarChart2, FileText, 
  Image as ImageIcon, Video, Music, 
  Upload, Cpu, Download, 
  Users, Shield, Activity, 
  Settings, User, Sliders,
  Menu, X
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'Dashboard',
    items: [
      { name: 'Overview', icon: Home },
      { name: 'Analytics', icon: BarChart2 },
      { name: 'Reports', icon: FileText },
    ],
  },
  {
    title: 'Media',
    items: [
      { name: 'Images', icon: ImageIcon },
      { name: 'Videos', icon: Video },
      { name: 'Audio', icon: Music },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Upload', icon: Upload },
      { name: 'Processing', icon: Cpu },
      { name: 'Export', icon: Download },
    ],
  },
  {
    title: 'Team',
    items: [
      { name: 'Members', icon: Users },
      { name: 'Roles', icon: Shield },
      { name: 'Activity', icon: Activity },
    ],
  },
  {
    title: 'Settings',
    items: [
      { name: 'Profile', icon: User },
      { name: 'Security', icon: Sliders },
      { name: 'Preferences', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setIsOpen(false); // Reset on desktop so hover works
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobile = () => {
    if (isMobile) setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <button 
          onClick={toggleMobile}
          className="fixed top-4 left-4 z-50 p-3 rounded-2xl bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-200 shadow-xl transition-colors hover:bg-white/30 dark:hover:bg-black/40"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/10 backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleMobile}
        />
      )}

      {/* Glassmorphism Sidebar Container */}
      <aside 
        className={`fixed top-0 lg:top-4 bottom-0 lg:bottom-4 z-40 transition-all duration-[400ms] ease-out flex flex-col
          ${isMobile ? (isOpen ? 'left-0 w-[280px]' : '-left-full w-[280px]') : 'left-4 w-[80px] hover:w-[280px] group'}
          bg-white/15 dark:bg-black/25 backdrop-blur-2xl border border-white/30 dark:border-white/10 
          shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]
          ${isMobile ? 'rounded-r-3xl' : 'rounded-[32px]'}
        `}
      >
        {/* Header / Logo */}
        <div className={`flex items-center h-24 shrink-0 transition-all duration-300 ${isMobile ? 'px-6 mt-16' : 'px-5 justify-center group-hover:justify-start group-hover:px-6'}`}>
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg relative">
             <span className="text-white font-bold text-xl">V</span>
          </div>
          <h1 
            className={`whitespace-nowrap ml-4 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-300 transition-all duration-300 ${isMobile ? 'opacity-100' : 'opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 group-hover:delay-100'} overflow-hidden`}
          >
            Vanta App
          </h1>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-6 space-y-6 mt-2">
          {SECTIONS.map((section, sIdx) => {
            return (
              <div key={sIdx} className="relative">
                {/* Section Title */}
                <h2 className={`px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-all duration-300 ${isMobile ? 'mb-3 opacity-100' : 'h-0 opacity-0 overflow-hidden group-hover:h-auto group-hover:opacity-100 group-hover:mb-3 group-hover:delay-150'}`}>
                  {section.title}
                </h2>
                
                <ul className="space-y-1.5 flex flex-col items-center lg:items-start group-hover:items-stretch lg:px-2">
                  {section.items.map((item, iIdx) => (
                    <li key={iIdx} className="relative w-full sidebar-tooltip-container">
                      <a href="#" className={`flex items-center p-3 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-white hover:shadow-sm transition-all duration-200 ${isMobile ? 'justify-start w-full' : 'justify-center w-12 group-hover:w-full group-hover:justify-start'}`}>
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                          <item.icon size={22} strokeWidth={1.5} />
                        </div>
                        <span className={`ml-4 text-[15px] font-medium whitespace-nowrap transition-all duration-300 ${isMobile ? 'opacity-100' : 'w-0 opacity-0 overflow-hidden group-hover:w-auto group-hover:opacity-100 group-hover:delay-100'}`}>
                          {item.name}
                        </span>
                      </a>

                      {/* Cool Minimal Tooltip (Desktop only, visible when Sidebar is collapsed) */}
                      {!isMobile && (
                        <div className="sidebar-tooltip absolute left-[calc(100%+20px)] top-1/2 -translate-y-1/2 px-4 py-2 bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/40 dark:border-white/10 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-xl opacity-0 invisible pointer-events-none transition-all duration-300 z-50 shadow-xl whitespace-nowrap flex items-center group-hover/aside:hidden">
                          {item.name}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
