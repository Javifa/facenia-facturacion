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

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel de Control</h1>
          <p className="text-sm text-slate-500">
            Resumen contable y gestión de cobros en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('nueva-factura')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 active:bg-brand-800 shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Factura</span>
          </button>
          <button
            onClick={() => onNavigate('clientes')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Clientes</span>
          </button>
          <button
            onClick={() => onNavigate('configuracion')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Configuración</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS (Calculadas con datos reales) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facturado */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Facturado
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-brand-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(stats.importeTotalFacturado)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.totalFacturas} facturas emitidas en total
            </p>
          </div>
        </div>

        {/* Pendiente de Cobro */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pendiente de Cobro
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-amber-700">
              {formatCurrency(stats.importePendienteCobro)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.facturasPendientesCobro} facturas por cobrar
              {stats.facturasVencidas > 0 && (
                <span className="text-red-600 font-semibold ml-1">
                  ({stats.facturasVencidas} vencidas)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Total Cobrado */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Cobrado
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-emerald-700">
              {formatCurrency(stats.importeCobrado)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.facturasCobradas} facturas liquidadas
            </p>
          </div>
        </div>

        {/* Borradores */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Borradores en Curso
            </span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900">
              {stats.facturasBorrador}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Facturas no emitidas pendientes de confirmación
            </p>
          </div>
        </div>
      </div>

      {/* ÚLTIMAS FACTURAS CREADAS O ESTADO VACÍO */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Últimas Facturas Registradas</h2>
            <p className="text-xs text-slate-500">Documentos más recientes en el sistema</p>
          </div>
          <button
            onClick={() => onNavigate('facturas')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
          >
            <span>Ver todas las facturas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentFacturas.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No hay facturas guardadas todavía</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Empiece creando su primera factura comercial para generar el PDF y alimentar las estadísticas contables.
            </p>
            <div className="mt-4">
              <button
                onClick={() => onNavigate('nueva-factura')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 shadow-subtle"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Crear mi primera factura</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {recentFacturas.slice(0, 6).map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {f.numero}
                    </td>
                    <td className="py-3 px-4 font-medium max-w-[200px] truncate">
                      {f.clienteSnapshot?.nombreOrazonSocial || 'Sin asignar'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(f.fechaEmision)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(f.fechaVencimiento)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
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
