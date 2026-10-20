import React, { useState, useMemo } from 'react';
import type { Factura } from '../../types';
import { formatCurrency, formatDate } from '../../utils/taxCalculator';
import { PaymentModal } from './PaymentModal';
import { RectifyModal } from './RectifyModal';
import {
  FileText,
  Search,
  PlusCircle,
  Eye,
  Edit2,
  Trash2,
  CreditCard,
  FileDiff,
} from 'lucide-react';

interface InvoicesListViewProps {
  facturas: Factura[];
  onNewInvoice: () => void;
  onEditInvoice: (factura: Factura) => void;
  onDeleteInvoice: (id: string) => void;
  onPreviewInvoice: (factura: Factura) => void;
  onAddPago: (
    facturaId: string,
    pago: { fecha: string; importe: number; metodo: string; referencia?: string; notas?: string }
  ) => void;
  onRectify: (facturaId: string, motivo: string) => void;
}

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({
  facturas,
  onNewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onPreviewInvoice,
  onAddPago,
  onRectify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [sortBy, setSortBy] = useState<'fecha-desc' | 'fecha-asc' | 'numero' | 'importe-desc'>('fecha-desc');

  // Modales secundarios
  const [paymentFactura, setPaymentFactura] = useState<Factura | null>(null);
  const [rectifyFactura, setRectifyFactura] = useState<Factura | null>(null);

  // Filtrado y ordenación
  const filteredFacturas = useMemo(() => {
    return facturas
      .filter((f) => {
        const q = searchTerm.toLowerCase();
        const matchText =
          f.numero.toLowerCase().includes(q) ||
          f.clienteSnapshot?.nombreOrazonSocial?.toLowerCase().includes(q) ||
          f.clienteSnapshot?.nifCif?.toLowerCase().includes(q);

        if (!matchText) return false;

        if (statusFilter !== 'todos' && f.estado !== statusFilter) {
          return false;
        }

        if (fechaDesde && f.fechaEmision < fechaDesde) return false;
        if (fechaHasta && f.fechaEmision > fechaHasta) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'fecha-desc') {
          return b.fechaEmision.localeCompare(a.fechaEmision) || b.numero.localeCompare(a.numero);
        }
        if (sortBy === 'fecha-asc') {
          return a.fechaEmision.localeCompare(b.fechaEmision) || a.numero.localeCompare(b.numero);
        }
        if (sortBy === 'numero') {
          return b.numero.localeCompare(a.numero);
        }
        if (sortBy === 'importe-desc') {
          return b.totalFinal - a.totalFinal;
        }
        return 0;
      });
  }, [facturas, searchTerm, statusFilter, fechaDesde, fechaHasta, sortBy]);

  const resumenFiltrado = useMemo(() => {
    return filteredFacturas.reduce(
      (acc, f) => {
        if (f.estado !== 'borrador') {
          acc.total += f.totalFinal || 0;
          acc.pendiente += f.importePendiente || 0;
        }
        return acc;
      },
      { total: 0, pendiente: 0 }
    );
  }, [filteredFacturas]);

  const getBadgeClass = (estado: Factura['estado']) => {
    switch (estado) {
      case 'cobrada':
        return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'pendiente_cobro':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'parcialmente_cobrada':
        return 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800';
      case 'vencida':
        return 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'rectificada':
        return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'borrador':
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getEstadoLabel = (estado: Factura['estado']) => {
    switch (estado) {
      case 'cobrada':
        return 'Cobrada';
      case 'pendiente_cobro':
        return 'Pendiente';
      case 'parcialmente_cobrada':
        return 'Cobro Parcial';
      case 'vencida':
        return 'Vencida';
      case 'rectificada':
        return 'Rectificada';
      case 'anulada':
        return 'Anulada';
      case 'borrador':
        return 'Borrador';
      default:
        return estado;
    }
  };

  const handleDelete = (id: string, numero: string) => {
    if (window.confirm(`¿Está seguro de eliminar el borrador "${numero}"?`)) {
      try {
        onDeleteInvoice(id);
      } catch (err: any) {
        alert(err.message || 'No se pudo eliminar la factura.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Libro Registro de Facturas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Consulta histórica, conciliación de cobros y emisión de facturas rectificativas.
          </p>
        </div>

        <button
          onClick={onNewInvoice}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-sm font-semibold shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Emitir Factura</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="ui-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Búsqueda */}
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="filter-search-invoice"
              name="searchInvoice"
              aria-label="Buscar por número o cliente"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número, razón social o NIF..."
              className="ui-input pl-9 py-2 text-xs"
            />
          </div>

          {/* Filtro Estado */}
          <div>
            <select
              id="filter-status-invoice"
              name="statusFilter"
              aria-label="Filtrar por estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ui-input py-2 text-xs"
            >
              <option value="todos">Todos los estados</option>
              <option value="borrador">Borradores</option>
              <option value="pendiente_cobro">Pendientes de cobro</option>
              <option value="parcialmente_cobrada">Cobro parcial</option>
              <option value="cobrada">Cobradas</option>
              <option value="vencida">Vencidas</option>
              <option value="rectificada">Rectificadas</option>
            </select>
          </div>

          {/* Ordenación */}
          <div>
            <select
              id="filter-sort-invoice"
              name="sortBy"
              aria-label="Ordenar facturas"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="ui-input py-2 text-xs"
            >
              <option value="fecha-desc">Fecha: Más reciente</option>
              <option value="fecha-asc">Fecha: Más antigua</option>
              <option value="numero">Número correlativo</option>
              <option value="importe-desc">Mayor importe</option>
            </select>
          </div>

          {/* Fechas desde/hasta */}
          <div className="flex items-center gap-1.5">
            <input
              id="filter-date-from"
              name="fechaDesde"
              aria-label="Fecha desde"
              type="date"
              title="Fecha desde"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="ui-input w-1/2 px-2 py-2 text-[11px]"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              id="filter-date-to"
              name="fechaHasta"
              aria-label="Fecha hasta"
              type="date"
              title="Fecha hasta"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="ui-input w-1/2 px-2 py-2 text-[11px]"
            />
          </div>
        </div>

        {/* Resumen de filtro activo */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Mostrando <strong className="text-slate-900 dark:text-white">{filteredFacturas.length}</strong> de{' '}
              <strong className="text-slate-900 dark:text-white">{facturas.length}</strong> facturas
            </span>
            {filteredFacturas.length > 0 && (
              <span className="hidden sm:inline text-slate-400 dark:text-slate-600">|</span>
            )}
            {filteredFacturas.length > 0 && (
              <span>
                Total emitido en vista:{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {formatCurrency(resumenFiltrado.total)}
                </strong>
              </span>
            )}
          </div>
          {(searchTerm || statusFilter !== 'todos' || fechaDesde || fechaHasta) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('todos');
                setFechaDesde('');
                setFechaHasta('');
              }}
              className="text-brand-700 dark:text-brand-400 hover:underline font-semibold"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="ui-card overflow-hidden">
        {filteredFacturas.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              No se encontraron facturas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Ajuste los criterios de búsqueda o emita un nuevo documento fiscal.
            </p>
            <div className="mt-5">
              <button
                onClick={onNewInvoice}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Crear nueva factura</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Cliente / Receptor</th>
                  <th className="py-3 px-4">Emisión / Venc.</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Pendiente</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredFacturas.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{f.numero}</span>
                        {f.esRectificativa && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                            R
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-sans">
                        Serie {f.serie}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium max-w-[220px]">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {f.clienteSnapshot?.nombreOrazonSocial || 'Sin asignar'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {f.clienteSnapshot?.nifCif}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{formatDate(f.fechaEmision)}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        Vence: {formatDate(f.fechaVencimiento)}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {formatCurrency(f.totalFinal)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      {f.importePendiente > 0 ? (
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">
                          {formatCurrency(f.importePendiente)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Liquidada</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeClass(
                          f.estado
                        )}`}
                      >
                        {getEstadoLabel(f.estado)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onPreviewInvoice(f)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Ver y descargar PDF"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onEditInvoice(f)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title={f.estado === 'borrador' ? 'Editar borrador' : 'Ver detalle'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {f.estado !== 'borrador' && f.importePendiente > 0 && (
                          <button
                            onClick={() => setPaymentFactura(f)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Registrar cobro"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {f.estado !== 'borrador' && !f.esRectificativa && f.estado !== 'rectificada' && (
                          <button
                            onClick={() => setRectifyFactura(f)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
                            title="Emitir factura rectificativa"
                          >
                            <FileDiff className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {f.estado === 'borrador' && (
                          <button
                            onClick={() => handleDelete(f.id, f.numero)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            title="Eliminar borrador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Registro de Cobros */}
      <PaymentModal
        factura={paymentFactura}
        isOpen={Boolean(paymentFactura)}
        onClose={() => setPaymentFactura(null)}
        onAddPago={onAddPago}
      />

      {/* Modal de Factura Rectificativa */}
      <RectifyModal
        factura={rectifyFactura}
        isOpen={Boolean(rectifyFactura)}
        onClose={() => setRectifyFactura(null)}
        onConfirmRectify={onRectify}
      />
    </div>
  );
};
