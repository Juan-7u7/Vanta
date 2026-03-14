import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import './App.css';

function AppContent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" /> : <Login />} 
      />
      
      <Route 
        path="/dashboard" 
        element={
          user ? (
            <div className="min-h-screen relative z-0 flex">
              <Sidebar onLogout={signOut} />
              <main className="flex-1 transition-all duration-[400ms] lg:pl-[120px] p-6 lg:py-10 lg:pr-10">
                {/* El card de Panel de Control ha sido removido. Aquí irá el contenido de los módulos. */}
              </main>
            </div>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="fixed inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#0B2447_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#0B2447_100%)] dark:items-center dark:px-5 dark:py-24"></div>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
