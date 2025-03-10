import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import MovementForm from '@/components/inventory/MovementForm';
import { usePagination } from '@/hooks/usePagination';
import SearchInput from '@/components/common/SearchInput';
import Pagination from '@/components/common/Pagination';

export default function Inventory() {
  const [movements, setMovements] = useState([]);
  const { profile } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems
  } = usePagination({
    data: movements,
    itemsPerPage: 10,
    searchFields: ['product.name', 'movement_type', 'notes'],
    searchValue
  });

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    const { data } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        product:products(name),
        user:profiles(full_name)
      `)
      .order('created_at', { ascending: false });
    
    setMovements(data || []);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Movimientos de Inventario</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {showForm ? 'Ocultar Formulario' : 'Nuevo Movimiento'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <MovementForm onSuccess={() => {
            loadMovements();
            setShowForm(false);
          }} />
        </div>
      )}

      <div className="mb-6">
        <SearchInput
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Buscar por producto, tipo o notas..."
          resultCount={totalItems}
        />
      </div>
      
      <div className="bg-white dark:bg-dark-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
          <thead className="bg-gray-50 dark:bg-dark-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Cantidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Notas
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-800 dark:divide-dark-700">
            {paginatedData.map((movement: any) => (
              <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(movement.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {movement.product?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    movement.movement_type === 'in'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {movement.movement_type === 'in' ? 'Entrada' : 'Salida'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {movement.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {movement.user?.full_name || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {movement.notes || ''}
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