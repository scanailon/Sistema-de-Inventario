import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { supabase } from '@/lib/supabase/client';
import { FileText, Download } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Reports() {
  const { profile } = useAuthStore();
  const { isDark } = useThemeStore();
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([new Date(), new Date()]);
  const [startDate, endDate] = dateRange;
  const [reportType, setReportType] = useState('inventory');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<{
    title: string;
    movements?: any[];
    performance?: any[];
    summary: {
      totalIn?: number;
      totalOut?: number;
      totalRating?: number;
      count?: number;
    };
  } | null>(null);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Por favor selecciona un rango de fechas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let data;
      switch (reportType) {
        case 'inventory': {
          const { data: movements } = await supabase
            .from('inventory_movements')
            .select(`
              *,
              product:products(name, current_stock, unit_price),
              user:profiles(full_name)
            `)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });

          data = {
            title: 'Reporte de Movimientos de Inventario',
            movements: movements || [],
            summary: (movements || []).reduce((acc: any, mov: any) => {
              if (mov.movement_type === 'in') {
                acc.totalIn = (acc.totalIn || 0) + mov.quantity;
              } else {
                acc.totalOut = (acc.totalOut || 0) + mov.quantity;
              }
              return acc;
            }, { totalIn: 0, totalOut: 0 })
          };
          break;
        }

        case 'performance': {
          let query = supabase
            .from('employee_performance')
            .select(`
              *,
              employee:profiles!employee_id(full_name)
            `)
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString())
            .order('date', { ascending: false });

          if (profile?.role !== 'admin') {
            query = query.eq('employee_id', profile?.id);
          }

          const { data: performance } = await query;

          data = {
            title: profile?.role === 'admin' 
              ? 'Reporte de Desempeño de Empleados'
              : 'Mi Reporte de Desempeño',
            performance: performance || [],
            summary: (performance || []).reduce((acc: any, perf: any) => {
              if (perf.performance_rating) {
                acc.totalRating = (acc.totalRating || 0) + perf.performance_rating;
                acc.count = (acc.count || 0) + 1;
              }
              return acc;
            }, { totalRating: 0, count: 0 })
          };
          break;
        }

        default:
          throw new Error('Tipo de reporte inválido');
      }

      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    
    // Agregar título
    doc.setFontSize(16);
    doc.text(reportData.title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Rango de fechas: ${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`, 14, 40);

    if (reportType === 'inventory' && reportData.movements) {
      // Agregar resumen
      doc.text('Resumen:', 14, 50);
      doc.text(`Total Entradas: ${reportData.summary.totalIn || 0}`, 14, 60);
      doc.text(`Total Salidas: ${reportData.summary.totalOut || 0}`, 14, 70);

      // Agregar tabla de movimientos
      const tableData = reportData.movements.map((mov: any) => [
        new Date(mov.created_at).toLocaleDateString(),
        mov.product?.name || 'N/A',
        mov.movement_type === 'in' ? 'Entrada' : 'Salida',
        mov.quantity,
        mov.user?.full_name || 'N/A',
        mov.notes || ''
      ]);

      (doc as any).autoTable({
        startY: 80,
        head: [['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Usuario', 'Notas']],
        body: tableData,
      });
    } else if (reportType === 'performance' && reportData.performance) {
      // Agregar resumen de desempeño
      const avgRating = reportData.summary.count && reportData.summary.count > 0
        ? (reportData.summary.totalRating! / reportData.summary.count).toFixed(2)
        : '0.00';
      doc.text('Resumen:', 14, 50);
      doc.text(`Calificación Promedio: ${avgRating}`, 14, 60);
      doc.text(`Total Registros: ${reportData.summary.count || 0}`, 14, 70);

      // Agregar tabla de desempeño
      const tableData = reportData.performance.map((perf: any) => [
        new Date(perf.date).toLocaleDateString(),
        perf.employee?.full_name || 'N/A',
        perf.attendance_status === 'present' ? 'Presente' : 'Ausente',
        perf.performance_rating || 'N/A',
        perf.notes || ''
      ]);

      (doc as any).autoTable({
        startY: 80,
        head: [['Fecha', 'Empleado', 'Asistencia', 'Calificación', 'Notas']],
        body: tableData,
      });
    }

    doc.save(`${reportType}-reporte-${new Date().toISOString()}.pdf`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reportes</h1>

      <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Reporte
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
            >
              <option value="inventory">Movimientos de Inventario</option>
              <option value="performance">
                {profile?.role === 'admin' ? 'Desempeño de Empleados' : 'Mi Desempeño'}
              </option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rango de Fechas
            </label>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <FileText className="h-5 w-5 inline-block mr-2" />
              Generar Reporte
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {reportData && (
        <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold dark:text-white">{reportData.title}</h2>
            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              <Download className="h-5 w-5 inline-block mr-2" />
              Descargar PDF
            </button>
          </div>

          {reportType === 'inventory' && reportData.movements && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 dark:text-gray-300">Total Entradas</h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {reportData.summary.totalIn || 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 dark:text-gray-300">Total Salidas</h3>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {reportData.summary.totalOut || 0}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <Bar
                  data={{
                    labels: ['Movimientos de Stock'],
                    datasets: [
                      {
                        label: 'Entradas',
                        data: [reportData.summary.totalIn || 0],
                        backgroundColor: 'rgba(34, 197, 94, 0.5)',
                      },
                      {
                        label: 'Salidas',
                        data: [reportData.summary.totalOut || 0],
                        backgroundColor: 'rgba(239, 68, 68, 0.5)',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          color: isDark ? '#fff' : '#000'
                        }
                      },
                      title: {
                        display: true,
                        text: 'Resumen de Movimientos',
                        color: isDark ? '#fff' : '#000'
                      },
                    },
                    scales: {
                      y: {
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

              <div className="overflow-x-auto">
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
                    {reportData.movements.map((movement: any) => (
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
              </div>
            </>
          )}

          {reportType === 'performance' && reportData.performance && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 dark:text-gray-300">Calificación Promedio</h3>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {reportData.summary.count && reportData.summary.count > 0
                      ? (reportData.summary.totalRating! / reportData.summary.count).toFixed(2)
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 dark:text-gray-300">Total Registros</h3>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {reportData.summary.count || 0}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Empleado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Asistencia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Calificación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-800 dark:divide-dark-700">
                    {reportData.performance.map((record: any) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {record.employee?.full_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.attendance_status === 'present'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {record.attendance_status === 'present' ? 'Presente' : 'Ausente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {record.performance_rating || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {record.notes || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}