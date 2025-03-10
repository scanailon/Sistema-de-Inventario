import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { LogOut, Bell, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex-1 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-slate-900 hidden sm:block dark:text-white">
        Sistema de Inventario
      </h1>
      
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-dark-700"
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        <button className="p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-dark-700">
          <Bell className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {profile?.full_name}
            </p>
            <p className="text-xs text-slate-500 capitalize dark:text-slate-400">
              {profile?.role === 'admin' ? 'Administrador' : 'Empleado'}
            </p>
          </div>
          
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/50"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}