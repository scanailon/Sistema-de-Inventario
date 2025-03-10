import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Menu } from 'lucide-react';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-900 dark:to-dark-800">
      {/* Overlay del Menú Móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-800/50 backdrop-blur-sm z-40 lg:hidden dark:bg-black/50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Barra de Navegación */}
      <div className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-sm border-b border-slate-200 dark:bg-dark-800/80 dark:border-dark-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Botón de menú móvil */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:text-slate-200 dark:hover:bg-dark-700"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Navbar />
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Barra lateral */}
        <div 
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-sm transform transition-transform duration-200 ease-in-out
            lg:translate-x-0 lg:static lg:z-auto dark:bg-dark-800/80 dark:border-dark-700
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Contenido Principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200/50 p-6 dark:bg-dark-800/60 dark:ring-dark-700/50">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}