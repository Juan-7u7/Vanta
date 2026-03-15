import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen relative z-0 flex">
      <Sidebar onLogout={signOut} />
      <main className="flex-1 transition-all duration-[400ms] lg:pl-[120px] p-6 lg:py-10 lg:pr-10">
        {/* El contenido de los módulos se renderizará aquí */}
      </main>
    </div>
  );
}
