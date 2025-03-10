import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Package, TrendingUp, AlertTriangle, BarChart, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { Bar } from 'react-chartjs-2';

interface DashboardMetrics {
  totalProducts: number;
  lowStockItems: number;
  totalMovements: number;
  totalValue: number;
  recentMovements: any[];
  topProducts: any[];
  stockChanges: {
    percentage: number;
    trend: 'up' | 'down' | 'neutral';
  };
}

export default function Dashboard() {
  const { profile } = useAuthStore();
  const { isDark } = useThemeStore();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProducts: 0,
    lowStockItems: 0,
    totalMovements: 0,
    totalValue: 0,
    recentMovements: [],
    topProducts: [],
    stockChanges: {
      percentage: 0,
      trend: 'neutral'
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        setError('');

        const [
          { count: productsCount },
          { data: lowStockData },
          { count: movementsCount },
          { data: inventoryValue },
          { data: recentMovements },
          { data: topProducts },
          { data: previousMovements }
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('products')
            .select('id')
            .lt('current_stock', 10),
          supabase.from('inventory_movements')
            .select('*', { count: 'exact', head: true }),
          supabase.from('products')
            .select('current_stock, unit_price'),
          supabase.from('inventory_movements')
            .select(`
              *,
              product:products(name),
              user:profiles(full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase.from('products')
            .select('name, current_stock')
            .order('current_stock', { ascending: false })
            .limit(5),
          supabase.from('inventory_movements')
            .select('movement_type, quantity')
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        ]);

        // Calcular cambio en el stock
        const stockChange = (previousMovements || []).reduce((acc, mov) => {
          return acc + (mov.movement_type === 'in' ? mov.quantity : -mov.quantity);
        }, 0);

        const totalValue = (inventoryValue || []).reduce(
          (sum, item) => sum + (item.current_stock * Number(item.unit_price)),
          0
        );

        setMetrics({
          totalProducts: productsCount || 0,
          lowStockItems: lowStockData?.length || 0,
          totalMovements: movementsCount || 0,
          totalValue,
          recentMovements: recentMovements || [],
          topProducts: topProducts || [],
          stockChanges: {
            percentage: Math.abs(stockChange),
            trend: stockChange > 0 ? 'up' : stockChange < 0 ? 'down' : 'neutral'
          }
        });
      } catch (err) {
        setError('Error al cargar las métricas del panel');
        console.error('Error del panel:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Panel Principal</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Última actualización: {new Date().toLocaleString()}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Productos</p>
              <p className="text-2xl font-semibold dark:text-white">{metrics.totalProducts}</p>
            </div>
          </div>
          {metrics.stockChanges.trend !== 'neutral' && (
            <div className="mt-2 flex items-center text-sm">
              {metrics.stockChanges.trend === 'up' ? (
                <>
                  <ArrowUp className="h-4 w-4 text-green-500 dark:text-green-400" />
                  <span className="text-green-500 dark:text-green-400 ml-1">
                    +{metrics.stockChanges.percentage} unidades este mes
                  </span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-4 w-4 text-red-500 dark:text-red-400" />
                  <span className="text-red-500 dark:text-red-400 ml-1">
                    -{metrics.stockChanges.percentage} unidades este mes
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Productos Bajo Stock</p>
              <p className="text-2xl font-semibold dark:text-white">{metrics.lowStockItems}</p>
            </div>
          </div>
          <div className="mt-2 text-sm">
            {metrics.lowStockItems > 0 ? (
              <span className="text-red-500 dark:text-red-400">Requiere atención inmediata</span>
            ) : (
              <span className="text-green-500 dark:text-green-400">Stock en niveles óptimos</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500 dark:text-green-400" />
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Movimientos</p>
              <p className="text-2xl font-semibold dark:text-white">{metrics.totalMovements}</p>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Últimas 24 horas
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <BarChart className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Valor Total</p>
              <p className="text-2xl font-semibold dark:text-white">
                ${metrics.totalValue.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Inventario actual
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Últimos Movimientos</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Producto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Cantidad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {metrics.recentMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{movement.product?.name || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        movement.movement_type === 'in'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {movement.movement_type === 'in' ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{movement.quantity}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{movement.user?.full_name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Productos con Mayor Stock</h2>
          <div className="h-64">
            <Bar
              data={{
                labels: metrics.topProducts.map(p => p.name),
                datasets: [
                  {
                    label: 'Stock Actual',
                    data: metrics.topProducts.map(p => p.current_stock),
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.5)',
                    borderColor: isDark ? 'rgb(129, 140, 248)' : 'rgb(99, 102, 241)',
                    borderWidth: 1
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Cantidad',
                      color: isDark ? '#fff' : '#000'
                    },
                    ticks: {
                      color: isDark ? '#fff' : '#000'
                    },
                    grid: {
                      color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                  },
                  x: {
                    ticks: {
                      color: isDark ? '#fff' : '#000'
                    },
                    grid: {
                      color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}