import React, { useState } from 'react';
import type { Cliente } from '../../types';
import { ClientModal } from './ClientModal';
import {
  Users,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building,
} from 'lucide-react';

interface ClientsViewProps {
  clientes: Cliente[];
  onCreateCliente: (clienteData: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateCliente: (id: string, clienteData: Partial<Cliente>) => void;
  onDeleteCliente: (id: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clientes,
  onCreateCliente,
  onUpdateCliente,
  onDeleteCliente,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const filteredClientes = clientes.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.nombreOrazonSocial.toLowerCase().includes(q) ||
      c.nifCif.toLowerCase().includes(q) ||
      c.ciudad.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const handleOpenCreate = () => {
    setEditingCliente(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingCliente) {
      onUpdateCliente(editingCliente.id, data);
    } else {
      onCreateCliente(data);
    }
  };

  const handleDelete = (id: string, nombre: string) => {
    if (window.confirm(`¿Está seguro de eliminar el cliente "${nombre}"?`)) {
      try {
        onDeleteCliente(id);
      } catch (err: any) {
        alert(err.message || 'No se pudo eliminar el cliente.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Directorio de Clientes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Fichas fiscales, domicilios tributarios y datos de contacto.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 dark:bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 dark:hover:bg-brand-500 shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Añadir Cliente</span>
        </button>
      </div>

      {/* Barra de búsqueda y contador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ui-card p-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="search-clientes"
            name="searchClientes"
            type="text"
            aria-label="Buscar clientes"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, NIF/CIF, ciudad o correo..."
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Mostrando <span className="font-semibold text-slate-900 dark:text-white">{filteredClientes.length}</span> de{' '}
          <span className="font-semibold text-slate-900 dark:text-white">{clientes.length}</span> clientes registrados
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="ui-card overflow-hidden">
        {filteredClientes.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No se encontraron clientes</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'Pruebe con otros términos de búsqueda.'
                : 'Registre sus primeros clientes para poder asociarlos a las facturas.'}
            </p>
            {!searchTerm && (
              <div className="mt-4">
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 dark:bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-800 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Crear primer cliente</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Cliente / Razón Social</th>
                  <th className="py-3.5 px-4">NIF / CIF</th>
                  <th className="py-3.5 px-4">Ubicación Fiscal</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {filteredClientes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          <Building className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold">{c.nombreOrazonSocial}</p>
                          {c.notasInternas && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                              {c.notasInternas}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-200">
                      {c.nifCif}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>
                          {c.ciudad} ({c.provincia}), {c.codigoPostal}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[200px] mt-0.5">
                        {c.direccionFiscal}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 space-y-0.5">
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{c.email}</span>
                        </div>
                      )}
                      {c.telefono && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{c.telefono}</span>
                        </div>
                      )}
                      {!c.email && !c.telefono && <span className="text-slate-400 dark:text-slate-600">-</span>}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Editar cliente"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.nombreOrazonSocial)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Reutilizable */}
      <ClientModal
        isOpen={isModalOpen}
        cliente={editingCliente}
        existingClientes={clientes}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
      />
    </div>
  );
};
