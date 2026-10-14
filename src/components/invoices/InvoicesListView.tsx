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
        // Búsqueda texto
        const q = searchTerm.toLowerCase();
        const matchText =
          f.numero.toLowerCase().includes(q) ||
          f.clienteSnapshot?.nombreOrazonSocial?.toLowerCase().includes(q) ||
          f.clienteSnapshot?.nifCif?.toLowerCase().includes(q);

        if (!matchText) return false;

        // Filtro estado
        if (statusFilter !== 'todos' && f.estado !== statusFilter) {
          return false;
        }

        // Filtro fechas
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

  const getBadgeClass = (estado: Factura['estado']) => {
    switch (estado) {
      case 'cobrada':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pendiente_cobro':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'parcialmente_cobrada':
        return 'bg-blue-50 text-brand-700 border-blue-200';
      case 'vencida':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'rectificada':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'borrador':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Historial de Facturas</h1>
          <p className="text-sm text-slate-500">
            Registro cronológico, control de cobros y emisión de documentos fiscales.
          </p>
        </div>

        <button
          onClick={onNewInvoice}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Crear Factura</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Búsqueda */}
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número o cliente..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Filtro Estado */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="todos">Todos los Estados</option>
              <option value="borrador">Borradores</option>
              <option value="pendiente_cobro">Pendientes de Cobro</option>
              <option value="parcialmente_cobrada">Cobro Parcial</option>
              <option value="cobrada">Cobradas</option>
              <option value="vencida">Vencidas</option>
              <option value="rectificada">Rectificadas</option>
            </select>
          </div>

          {/* Ordenación */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
              type="date"
              title="Fecha desde"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-1/2 px-1.5 py-2 text-[11px] bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              title="Fecha hasta"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-1/2 px-1.5 py-2 text-[11px] bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        {/* Resumen de filtro activo */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Mostrando <strong>{filteredFacturas.length}</strong> de <strong>{facturas.length}</strong> facturas
          </span>
          {(searchTerm || statusFilter !== 'todos' || fechaDesde || fechaHasta) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('todos');
                setFechaDesde('');
                setFechaHasta('');
              }}
              className="text-brand-600 hover:text-brand-800 font-semibold"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {filteredFacturas.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No se encontraron facturas</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Ajuste los filtros de búsqueda o cree un nuevo documento fiscal.
            </p>
            <div className="mt-4">
              <button
                onClick={onNewInvoice}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Crear nueva factura</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-semibold">
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
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredFacturas.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Número */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{f.numero}</span>
                        {f.esRectificativa && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-purple-100 text-purple-800">
                            R
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Serie {f.serie}
                      </span>
                    </td>

                    {/* Cliente */}
                    <td className="py-3 px-4 font-medium max-w-[220px]">
                      <p className="font-semibold text-slate-900 truncate">
                        {f.clienteSnapshot?.nombreOrazonSocial || 'Sin asignar'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {f.clienteSnapshot?.nifCif}
                      </p>
                    </td>

                    {/* Fechas */}
                    <td className="py-3 px-4 text-slate-600">
                      <div>{formatDate(f.fechaEmision)}</div>
                      <div className="text-[10px] text-slate-400">
                        Vence: {formatDate(f.fechaVencimiento)}
                      </div>
                    </td>

                    {/* Total Final */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(f.totalFinal)}
                    </td>

                    {/* Pendiente de Cobro */}
                    <td className="py-3 px-4 text-right font-mono">
                      {f.importePendiente > 0 ? (
                        <span className="text-amber-700 font-semibold">
                          {formatCurrency(f.importePendiente)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Liquidada</span>
                      )}
                    </td>

                    {/* Estado Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeClass(
                          f.estado
                        )}`}
                      >
                        {getEstadoLabel(f.estado)}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ver / Descargar PDF */}
                        <button
                          onClick={() => onPreviewInvoice(f)}
                          className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Ver y descargar PDF"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Editar o Detalle */}
                        <button
                          onClick={() => onEditInvoice(f)}
                          className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title={f.estado === 'borrador' ? 'Editar borrador' : 'Ver detalle'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Registrar cobro (si no es borrador y tiene saldo pendiente) */}
                        {f.estado !== 'borrador' && f.importePendiente > 0 && (
                          <button
                            onClick={() => setPaymentFactura(f)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Registrar cobro"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Emitir rectificativa (si está emitida y no ha sido ya rectificada) */}
                        {f.estado !== 'borrador' && !f.esRectificativa && f.estado !== 'rectificada' && (
                          <button
                            onClick={() => setRectifyFactura(f)}
                            className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Emitir factura rectificativa"
                          >
                            <FileDiff className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Eliminar (solo borradores) */}
                        {f.estado === 'borrador' && (
                          <button
                            onClick={() => handleDelete(f.id, f.numero)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
