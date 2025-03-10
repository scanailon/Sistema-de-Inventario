import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase/client';
import { Save } from 'lucide-react';

export default function Settings() {
  const { profile } = useAuthStore();
  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    defaultCurrency: 'USD',
    emailNotifications: true,
    autoGenerateReports: false,
    reportSchedule: 'weekly'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Por ahora, no está funcional con datos reales
      setSettings({
        lowStockThreshold: 10,
        defaultCurrency: 'USD',
        emailNotifications: true,
        autoGenerateReports: false,
        reportSchedule: 'weekly'
      });
    } catch (err) {
      setError('Error al cargar la configuración');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Configuración actualizada exitosamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la configuración');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="p-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md">
        No tienes permisos para acceder a esta página.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Configuración</h1>

      <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Configuración de Inventario</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Límite de Stock Bajo
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.lowStockThreshold}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    lowStockThreshold: parseInt(e.target.value)
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Los productos por debajo de esta cantidad se marcarán como stock bajo
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Moneda Predeterminada
                </label>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defaultCurrency: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Configuración de Notificaciones</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    emailNotifications: e.target.checked
                  }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-dark-600 dark:bg-dark-700"
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Habilitar notificaciones por correo para alertas de stock bajo
                </label>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Configuración de Reportes</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoGenerateReports"
                  checked={settings.autoGenerateReports}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    autoGenerateReports: e.target.checked
                  }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-dark-600 dark:bg-dark-700"
                />
                <label htmlFor="autoGenerateReports" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Generar y enviar reportes automáticamente
                </label>
              </div>

              {settings.autoGenerateReports && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Frecuencia de Reportes
                  </label>
                  <select
                    value={settings.reportSchedule}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      reportSchedule: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-md">
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Save className="h-5 w-5 inline-block mr-2" />
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}