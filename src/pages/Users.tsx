import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { UserPlus, Eye } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import SearchInput from '@/components/common/SearchInput';
import Pagination from '@/components/common/Pagination';

export default function Users() {
  const { profile } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [viewingUser, setViewingUser] = useState(null);

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems
  } = usePagination({
    data: users,
    itemsPerPage: 10,
    searchFields: ['full_name', 'role'],
    searchValue
  });

  useEffect(() => {
    const loadUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(data || []);
    };

    loadUsers();
  }, []);

  const handleView = (user: any) => {
    setViewingUser(user);
    setShowAddUser(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;
      if (!user?.id) throw new Error('No se recibió ID de usuario al registrar');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          full_name: formData.fullName,
          role: 'employee'
        }]);

      if (profileError) throw profileError;

      setSuccess('Empleado agregado exitosamente');
      setFormData({ email: '', password: '', fullName: '' });
      setShowAddUser(false);

      const { data: updatedUsers } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(updatedUsers || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar empleado');
    } finally {
      setIsLoading(false);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Usuarios</h1>
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Agregar Empleado
        </button>
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

      {showAddUser && (
        <div className="mb-6 bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Agregar Nuevo Empleado</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {isLoading ? 'Agregando...' : 'Agregar Empleado'}
              </button>
            </div>
          </form>
        </div>
      )}

      {viewingUser && (
        <div className="mb-6 bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold dark:text-white">Detalles del Usuario</h2>
            <button
              onClick={() => setViewingUser(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600"
            >
              Cerrar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center dark:bg-primary-900/20">
                <span className="text-2xl font-medium text-primary-700 dark:text-primary-400">
                  {viewingUser.full_name[0]?.toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-medium mt-4 dark:text-white">{viewingUser.full_name}</h3>
              <span className={`mt-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                viewingUser.role === 'admin'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
              }`}>
                {viewingUser.role === 'admin' ? 'Administrador' : 'Empleado'}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Registro</h4>
                <p className="text-gray-900 dark:text-white">
                  {new Date(viewingUser.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Actualización</h4>
                <p className="text-gray-900 dark:text-white">
                  {new Date(viewingUser.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <SearchInput
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Buscar por nombre o rol..."
          resultCount={totalItems}
        />
      </div>
      
      <div className="bg-white dark:bg-dark-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
          <thead className="bg-gray-50 dark:bg-dark-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Fecha de Creación
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-800 dark:divide-dark-700">
            {paginatedData.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.full_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {user.role === 'admin' ? 'Administrador' : 'Empleado'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleView(user)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Ver detalles"
                  >
                    <Eye className="h-5 w-5" />
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