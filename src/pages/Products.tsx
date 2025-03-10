import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { Plus, Pencil, Trash, Eye } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import SearchInput from '@/components/common/SearchInput';
import Pagination from '@/components/common/Pagination';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import TextArea from '@/components/common/TextArea';
import Button from '@/components/common/Button';
import Alert from '@/components/common/Alert';

export default function Products() {
  const { profile } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category_id: '',
    location_id: '',
    unit_price: '',
    current_stock: '0',
    image_url: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems
  } = usePagination({
    data: products,
    itemsPerPage: 10,
    searchFields: ['name', 'sku', 'description'],
    searchValue
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadLocations();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select(`
        *,
        categories!products_category_id_fkey(name),
        locations!products_location_id_fkey(name)
      `);
    setProducts(data || []);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  };

  const loadLocations = async () => {
    const { data } = await supabase.from('locations').select('*');
    setLocations(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            ...formData,
            current_stock: parseInt(formData.current_stock) || 0,
            unit_price: parseFloat(formData.unit_price) || 0
          })
          .eq('id', editingProduct.id);
        if (error) throw error;
        setSuccess('Producto actualizado exitosamente');
      } else {
        const productData = {
          ...formData,
          current_stock: 0,
          unit_price: parseFloat(formData.unit_price) || 0
        };

        const { data: product, error: productError } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (productError) throw productError;

        const initialStock = parseInt(formData.current_stock) || 0;
        if (initialStock > 0) {
          const { error: movementError } = await supabase
            .from('inventory_movements')
            .insert([{
              product_id: product.id,
              user_id: profile?.id,
              movement_type: 'in',
              quantity: initialStock,
              notes: 'Stock inicial del producto',
            }]);

          if (movementError) throw movementError;
        }

        setSuccess('Producto creado exitosamente');
      }

      setShowForm(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        sku: '',
        category_id: '',
        location_id: '',
        unit_price: '',
        current_stock: '0',
        image_url: '',
      });
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      category_id: product.category_id || '',
      location_id: product.location_id || '',
      unit_price: product.unit_price.toString(),
      current_stock: product.current_stock.toString(),
      image_url: product.image_url || '',
    });
    setShowForm(true);
    setViewingProduct(null);
  };

  const handleView = (product: any) => {
    setViewingProduct(product);
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
      const { data: movements } = await supabase
        .from('inventory_movements')
        .select('id')
        .eq('product_id', id);

      if (movements && movements.length > 0) {
        const { error: movementsError } = await supabase
          .from('inventory_movements')
          .delete()
          .eq('product_id', id);

        if (movementsError) throw movementsError;
      }

      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (productError) throw productError;

      setSuccess('Producto eliminado exitosamente');
      loadProducts();
    } catch (err) {
      setError('No se pudo eliminar el producto. ' + (err instanceof Error ? err.message : 'Ocurrió un error'));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Productos</h1>
        {profile?.role === 'admin' && (
          <Button
            onClick={() => {
              setEditingProduct(null);
              setViewingProduct(null);
              setFormData({
                name: '',
                description: '',
                sku: '',
                category_id: '',
                location_id: '',
                unit_price: '',
                current_stock: '0',
                image_url: '',
              });
              setShowForm(!showForm);
            }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar Producto
          </Button>
        )}
      </div>

      <div className="mb-6">
        <SearchInput
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Buscar por nombre, SKU o descripción..."
          resultCount={totalItems}
        />
      </div>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" className="mb-4">
          {success}
        </Alert>
      )}

      {showForm && profile?.role === 'admin' && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />

              <Input
                label="SKU"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                required
              />

              <Select
                label="Categoría"
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                options={[
                  { value: '', label: 'Seleccionar categoría' },
                  ...categories.map((category: any) => ({
                    value: category.id,
                    label: category.name
                  }))
                ]}
              />

              <Select
                label="Ubicación"
                value={formData.location_id}
                onChange={(e) => setFormData(prev => ({ ...prev, location_id: e.target.value }))}
                options={[
                  { value: '', label: 'Seleccionar ubicación' },
                  ...locations.map((location: any) => ({
                    value: location.id,
                    label: location.name
                  }))
                ]}
              />

              <Input
                type="number"
                label="Precio Unitario"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_price: e.target.value }))}
                required
              />

              {!editingProduct && (
                <Input
                  type="number"
                  label="Stock Inicial"
                  min="0"
                  value={formData.current_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_stock: e.target.value }))}
                />
              )}

              <Input
                type="url"
                label="URL de Imagen"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              />
            </div>

            <TextArea
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
              >
                {editingProduct ? 'Actualizar Producto' : 'Agregar Producto'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {viewingProduct && (
        <Card className="mb-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold dark:text-white">Detalles del Producto</h2>
            <Button
              variant="secondary"
              onClick={() => setViewingProduct(null)}
            >
              Cerrar
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {viewingProduct.image_url && (
                <img
                  src={viewingProduct.image_url}
                  alt={viewingProduct.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-lg font-medium dark:text-white">{viewingProduct.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {viewingProduct.sku}</p>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</h4>
                <p className="text-gray-900 dark:text-white">{viewingProduct.description || 'Sin descripción'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Categoría</h4>
                <p className="text-gray-900 dark:text-white">{viewingProduct.categories?.name || 'Sin categoría'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ubicación</h4>
                <p className="text-gray-900 dark:text-white">{viewingProduct.locations?.name || 'Sin ubicación'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Actual</h4>
                <p className={`text-gray-900 dark:text-white ${
                  viewingProduct.current_stock > 10 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {viewingProduct.current_stock} unidades
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Precio Unitario</h4>
                <p className="text-gray-900 dark:text-white">${viewingProduct.unit_price}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Precio
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-800 dark:divide-dark-700">
              {paginatedData.map((product: any) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.image_url && (
                        <img
                          className="h-10 w-10 rounded-full mr-3"
                          src={product.image_url}
                          alt={product.name}
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {product.categories?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {product.locations?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.current_stock > 10
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {product.current_stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${product.unit_price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleView(product)}
                      className="text-blue-600 hover:text-blue-900 mr-3 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Ver detalles"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    {profile?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Editar"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}