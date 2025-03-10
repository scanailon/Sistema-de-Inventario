import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  LayoutDashboard,
  Package,
  History,
  Users,
  FolderTree,
  MapPin,
  FileSpreadsheet,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { profile } = useAuthStore();

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Panel Principal' },
    { to: '/products', icon: Package, label: 'Productos' },
    { to: '/inventory', icon: History, label: 'Inventario' },
    { to: '/reports', icon: FileSpreadsheet, label: 'Reportes' },
  ];

  if (profile?.role === 'admin') {
    links.push(
      { to: '/categories', icon: FolderTree, label: 'Categorías' },
      { to: '/locations', icon: MapPin, label: 'Ubicaciones' },
      { to: '/users', icon: Users, label: 'Usuarios' },
      { to: '/settings', icon: Settings, label: 'Configuración' }
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 dark:bg-dark-800 dark:border-dark-700">
      <div className="p-4 flex items-center justify-between lg:hidden">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Menú</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-dark-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-dark-700 dark:hover:text-white'
              }`
            }
          >
            <link.icon className="mr-3 h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-dark-700">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center dark:bg-primary-900/20">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
              {profile?.full_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate dark:text-white">
              {profile?.full_name}
            </p>
            <p className="text-xs text-slate-500 capitalize dark:text-slate-400">
              {profile?.role === 'admin' ? 'Administrador' : 'Empleado'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}