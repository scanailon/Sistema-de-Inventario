import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import TextArea from '@/components/common/TextArea';
import Alert from '@/components/common/Alert';

interface MovementFormProps {
  onSuccess?: () => void;
}

export default function MovementForm({ onSuccess }: MovementFormProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    productId: '',
    movementType: 'in',
    quantity: 1,
    notes: '',
  });
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, current_stock');
      setProducts(data || []);
    };
    loadProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (formData.movementType === 'out') {
        const product = products.find(p => p.id === formData.productId);
        if (product && formData.quantity > product.current_stock) {
          throw new Error('Stock insuficiente para esta operación');
        }
      }

      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert([{
          product_id: formData.productId,
          user_id: user?.id,
          movement_type: formData.movementType,
          quantity: formData.quantity,
          notes: formData.notes,
        }]);

      if (movementError) throw movementError;

      setFormData({
        productId: '',
        movementType: 'in',
        quantity: 1,
        notes: '',
      });

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setIsLoading(false);
    }
  };

  const productOptions = [
    { value: '', label: 'Selecciona un producto' },
    ...products.map(product => ({
      value: product.id,
      label: `${product.name} (Stock actual: ${product.current_stock})`
    }))
  ];

  const movementTypeOptions = [
    { value: 'in', label: 'Entrada' },
    { value: 'out', label: 'Salida' }
  ];

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Registrar Movimiento
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Producto"
          value={formData.productId}
          onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
          options={productOptions}
          required
        />

        <Select
          label="Tipo de Movimiento"
          value={formData.movementType}
          onChange={(e) => setFormData(prev => ({ ...prev, movementType: e.target.value }))}
          options={movementTypeOptions}
        />

        <Input
          type="number"
          label="Cantidad"
          min="1"
          value={formData.quantity}
          onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
          required
        />

        <TextArea
          label="Notas"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />

        {error && (
          <Alert type="error">
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Procesando...' : 'Registrar Movimiento'}
        </Button>
      </form>
    </Card>
  );
}