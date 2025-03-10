import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase/client';
import { Plus, Pencil, Trash, Upload, Download, Eye } from 'lucide-react';
import Papa from 'papaparse';
import { usePagination } from '@/hooks/usePagination';
import SearchInput from '@/components/common/SearchInput';
import Pagination from '@/components/common/Pagination';

export default function Locations() {
  const { profile } = useAuthStore();
  const [locations, setLocations] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [viewingLocation, setViewingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    operating_hours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: null,
      sunday: null
    }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchValue, setSearchValue] = useState('');

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems
  } = usePagination({
    data: locations,
    itemsPerPage: 10,
    searchFields: ['name', 'description'],
    searchValue
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');
    
    if (error) {
      setError(error.message);
    } else {
      setLocations(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingLocation) {
        const { error } = await supabase
          .from('locations')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingLocation.id);
        
        if (error) throw error;
        setSuccess('Ubicación actualizada exitosamente');
      } else {
        const { error } = await supabase
          .from('locations')
          .insert([formData]);
        
        if (error) throw error;
        setSuccess('Ubicación creada exitosamente');
      }

      setShowForm(false);
      setEditingLocation(null);
      setFormData({
        name: '',
        description: '',
        operating_hours: {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: null,
          sunday: null
        }
      });
      loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    }
  };

  const handleView = (location: any) => {
    setViewingLocation(location);
    setShowForm(false);
    setEditingLocation(null);
  };

  const handleEdit = (location: any) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      description: location.description || '',
      operating_hours: location.operating_hours
    });
    setShowForm(true);
    setViewingLocation(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) return;

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      loadLocations();
      setSuccess('Ubicación eliminada exitosamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        complete: async (results) => {
          const { data, errors } = results;
          if (errors.length > 0) {
            throw new Error('Formato CSV inválido');
          }

          const locations = data.map((row: any) => ({
            name: row.name,
            description: row.description,
            operating_hours: JSON.parse(row.operating_hours || '{}')
          }));

          const { error } = await supabase
            .from('locations')
            .insert(locations);
          
          if (error) throw error;
          loadLocations();
          setSuccess('Ubicaciones importadas exitosamente');
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar ubicaciones');
    }
  };

  const handleExport = () => {
    const exportData = locations.map(loc => ({
      name: loc.name,
      description: loc.description,
      operating_hours: JSON.stringify(loc.operating_hours)
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ubicaciones.csv';
    link.click();
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Ubicaciones</h1>
        <div className="flex space-x-3">
          <label className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
            />
            <Upload className="h-5 w-5 inline-block mr-2" />
            Importar CSV
          </label>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <Download className="h-5 w-5 inline-block mr-2" />
            Exportar CSV
          </button>
          <button
            onClick={() => {
              setEditingLocation(null);
              setFormData({
                name: '',
                description: '',
                operating_hours: {
                  monday: { open: '09:00', close: '17:00' },
                  tuesday: { open: '09:00', close: '17:00' },
                  wednesday: { open: '09:00', close: '17:00' },
                  thursday: { open: '09:00', close: '17:00' },
                  friday: { open: '09:00', close: '17:00' },
                  saturday: null,
                  sunday: null
                }
              });
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Plus className="h-5 w-5 inline-block mr-2" />
            Agregar Ubicación
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-md">
          {success}
        </div>
      )}

      <div className="mb-6">
        <SearchInput
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Buscar por nombre o descripción..."
          resultCount={totalItems}
        />
      </div>

      {viewingLocation && (
        <div className="mb-6 bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold dark:text-white">Detalles de la Ubicación</h2>
            <button
              onClick={() => setViewingLocation(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600"
            >
              Cerrar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium dark:text-white">{viewingLocation.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {viewingLocation.description || 'Sin descripción'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Horario de Operación</h4>
              {Object.entries(viewingLocation.operating_hours || {}).map(([day, hours]: [string, any]) => {
                if (!hours) return null;
                const dayNames = {
                  monday: 'Lunes',
                  tuesday: 'Martes',
                  wednesday: 'Miércoles',
                  thursday: 'Jueves',
                  friday: 'Viernes',
                  saturday: 'Sábado',
                  sunday: 'Domingo'
                };
                return (
                  <div key={day} className="text-gray-900 dark:text-white">
                    {dayNames[day]}: {hours.open} - {hours.close}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            {editingLocation ? 'Editar Ubicación' : 'Agregar Nueva Ubicación'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Horario de Operación</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {[
                  { day: 'monday', label: 'Lunes' },
                  { day: 'tuesday', label: 'Martes' },
                  { day: 'wednesday', label: 'Miércoles' },
                  { day: 'thursday', label: 'Jueves' },
                  { day: 'friday', label: 'Viernes' },
                  { day: 'saturday', label: 'Sábado' },
                  { day: 'sunday', label: 'Domingo' }
                ].map(({ day, label }) => (
                  <div key={day} className="flex items-center space-x-2">
                    <span className="w-24 text-gray-700 dark:text-gray-300">{label}</span>
                    <input
                      type="time"
                      value={formData.operating_hours[day]?.open || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        operating_hours: {
                          ...prev.operating_hours,
                          [day]: { ...prev.operating_hours[day], open: e.target.value }
                        }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                    />
                    <span className="text-gray-700 dark:text-gray-300">a</span>
                    <input
                      type="time"
                      value={formData.operating_hours[day]?.close || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        operating_hours: {
                          ...prev.operating_hours,
                          [day]: { ...prev.operating_hours[day], close: e.target.value }
                        }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {editingLocation ? 'Actualizar Ubicación' : 'Agregar Ubicación'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-dark-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
          <thead className="bg-gray-50 dark:bg-dark-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Horario de Operación
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-800 dark:divide-dark-700">
            {paginatedData.map((location) => (
              <tr key={location.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {location.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {location.description}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {Object.entries(location.operating_hours || {}).map(([day, hours]: [string, any]) => {
                    if (!hours) return null;
                    const dayNames = {
                      monday: 'Lunes',
                      tuesday: 'Martes',
                      wednesday: 'Miércoles',
                      thursday: 'Jueves',
                      friday: 'Viernes',
                      saturday: 'Sábado',
                      sunday: 'Domingo'
                    };
                    return (
                      <div key={day}>
                        {dayNames[day]}: {hours.open} - {hours.close}
                      </div>
                    );
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleView(location)}
                    className="text-blue-600 hover:text-blue-900 mr-3 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Ver detalles"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(location)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3 dark:text-indigo-400 dark:hover:text-indigo-300"
                    title="Editar"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(location.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Eliminar"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}