import React from 'react';
import type { Factura, ResumenEstadisticas } from '../../types';
import type { CurrentView } from '../layout/AppLayout';
import { formatCurrency, formatDate } from '../../utils/taxCalculator';
import {
  FileText,
  Clock,
  CheckCircle,
  PlusCircle,
  Users,
  Settings,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Eye,
} from 'lucide-react';

interface DashboardViewProps {
  stats: ResumenEstadisticas;
  recentFacturas: Factura[];
  onNavigate: (view: CurrentView) => void;
  onPreviewFactura: (factura: Factura) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentFacturas,
  onNavigate,
  onPreviewFactura,
}) => {
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

  const ratioCobro =
    stats.importeTotalFacturado > 0
      ? Math.min(100, Math.round((stats.importeCobrado / stats.importeTotalFacturado) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Resumen Financiero
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Métricas contables consolidadas y seguimiento de facturación emitida.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('nueva-factura')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Emitir Factura</span>
          </button>
          <button
            onClick={() => onNavigate('clientes')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 shadow-subtle transition-colors"
          >
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Clientes</span>
          </button>
          <button
            onClick={() => onNavigate('configuracion')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 shadow-subtle transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Configuración</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facturado */}
        <div className="ui-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Volumen Facturado
            </span>
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {formatCurrency(stats.importeTotalFacturado)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats.totalFacturas} {stats.totalFacturas === 1 ? 'factura emitida' : 'facturas emitidas'}
            </p>
          </div>
        </div>

        {/* Pendiente de Cobro */}
        <div className="ui-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pendiente de Cobro
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono">
              {formatCurrency(stats.importePendienteCobro)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats.facturasPendientesCobro} por liquidar
              {stats.facturasVencidas > 0 && (
                <span className="text-red-600 dark:text-red-400 font-semibold ml-1">
                  ({stats.facturasVencidas} vencidas)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Total Cobrado */}
        <div className="ui-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Importe Cobrado
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              {formatCurrency(stats.importeCobrado)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats.facturasCobradas} facturas liquidadas ({ratioCobro}%)
            </p>
          </div>
        </div>

        {/* Borradores */}
        <div className="ui-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Borradores Activos
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {stats.facturasBorrador}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pendientes de revisión y emisión
            </p>
          </div>
        </div>
      </div>

      {/* ÚLTIMAS FACTURAS CREADAS O ESTADO VACÍO */}
      <div className="ui-card overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Últimos Documentos Registrados
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Actividad más reciente en el libro registro de facturas
            </p>
          </div>
          <button
            onClick={() => onNavigate('facturas')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline transition-colors"
          >
            <span>Ver libro de facturas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentFacturas.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Aún no se han emitido facturas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Cree su primera factura para calcular impuestos automáticamente, generar el PDF oficial con el logotipo de FACENIA y activar las métricas contables.
            </p>
            <div className="mt-5">
              <button
                onClick={() => onNavigate('nueva-factura')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-subtle transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Emitir primera factura</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Documento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {recentFacturas.slice(0, 6).map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {f.numero}
                    </td>
                    <td className="py-3 px-4 font-medium max-w-[200px] truncate text-slate-900 dark:text-slate-100">
                      {f.clienteSnapshot?.nombreOrazonSocial || 'Sin asignar'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {formatDate(f.fechaEmision)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {formatDate(f.fechaVencimiento)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(f.totalFinal)}
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
                      <button
                        onClick={() => onPreviewFactura(f)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs font-medium transition-colors"
                        title="Ver PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
