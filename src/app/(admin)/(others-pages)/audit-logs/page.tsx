"use client";

import React, { useEffect, useState, useCallback } from "react";

interface AuditLogDetail {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
}

interface AuditLog {
  id: string;
  userId: number;
  userFullName: string;
  userEmail: string;
  action: string;
  module: string;
  entityId: string;
  entityType: string;
  timestamp: string;
  ipAddress: string | null;
  details: AuditLogDetail[];
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionLabels: Record<string, string> = {
  CREATE: "Creación",
  READ: "Lectura",
  UPDATE: "Edición",
  DELETE: "Eliminación",
};

const actionColors: Record<string, string> = {
  CREATE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  READ: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<Record<string, boolean | null>>({});

  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    userId: "",
    action: "",
    module: "",
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.action) params.append("action", filters.action);
      if (filters.module) params.append("module", filters.module);

      const res = await fetch(`/api/v1/audit-logs?${params}`);
      const data = await res.json();

      if (data.success && data.data) {
        setLogs(data.data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: data.data.pagination?.total || 0,
          totalPages: data.data.pagination?.totalPages || 0,
        }));
      } else if (data.error) {
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/v1/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const verifyIntegrity = async (logId: string) => {
    setVerifyingId(logId);
    try {
      const res = await fetch(`/api/v1/audit-logs/${logId}/verify`);
      const data = await res.json();

      if (data.success) {
        setIntegrityStatus((prev) => ({
          ...prev,
          [logId]: data.data.isValid,
        }));
      }
    } catch (error) {
      console.error("Error verifying integrity:", error);
      setIntegrityStatus((prev) => ({
        ...prev,
        [logId]: null,
      }));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleExportCSV = async () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.userId) params.append("userId", filters.userId);
    if (filters.action) params.append("action", filters.action);
    if (filters.module) params.append("module", filters.module);

    window.open(`/api/v1/audit-logs/export/csv?${params}`, "_blank");
  };

  const handleExportPDF = async () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.userId) params.append("userId", filters.userId);
    if (filters.action) params.append("action", filters.action);
    if (filters.module) params.append("module", filters.module);

    window.open(`/api/v1/audit-logs/export/pdf?${params}`, "_blank");
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      userId: "",
      action: "",
      module: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const modules = [...new Set(logs.map((log) => log.module))];
  const actions = [...new Set(logs.map((log) => log.action))];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Registro de Auditoría
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar PDF
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxgray">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Desde
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Hasta
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Usuario
            </label>
            <select
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark min-w-[180px] dark:text-white/90"
            >
              <option value="">Todos</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Acción
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
            >
              <option value="">Todas</option>
              <option value="CREATE">Creación</option>
              <option value="UPDATE">Edición</option>
              <option value="DELETE">Eliminación</option>
              <option value="READ">Lectura</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Módulo
            </label>
            <select
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value })}
              className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
            >
              <option value="">Todos</option>
              {modules.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Total registros: <span className="font-medium">{pagination.total}</span>
        </p>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxgray">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Usuario</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Acción</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Entidad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Módulo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Integridad</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No hay registros de auditoría
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className="border-b border-stroke dark:border-strokedark cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-800 dark:text-white/90">
                          {formatDate(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-800 dark:text-white/90">
                          {log.userFullName}
                        </div>
                        <div className="text-xs text-gray-500">{log.userEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${actionColors[log.action] || "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {actionLabels[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-gray-600 dark:text-gray-400">{log.entityType}</div>
                        <div className="text-xs text-gray-500 font-mono">{log.entityId}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {log.module}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {verifyingId === log.id ? (
                          <span className="text-gray-500">Verificando...</span>
                        ) : integrityStatus[log.id] !== undefined ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              verifyIntegrity(log.id);
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded ${integrityStatus[log.id]
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                          >
                            {integrityStatus[log.id] ? "✅ Válido" : "❌ Inválido"}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              verifyIntegrity(log.id);
                            }}
                            className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                          >
                            Verificar
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedLog === log.id && log.details && log.details.length > 0 && (
                      <tr className="bg-gray-50 dark:bg-gray-800/30">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="pl-4 border-l-2 border-brand-500">
                            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Detalle de Cambios:
                            </p>
                            <table className="w-full max-w-2xl">
                              <thead>
                                <tr className="text-left text-xs text-gray-500">
                                  <th className="pb-1 pr-4 font-medium">Campo</th>
                                  <th className="pb-1 pr-4 font-medium">Valor Anterior</th>
                                  <th className="pb-1 font-medium">Valor Nuevo</th>
                                </tr>
                              </thead>
                              <tbody className="text-sm">
                                {log.details.map((detail) => (
                                  <tr key={detail.id} className="border-t border-gray-200 dark:border-gray-700">
                                    <td className="py-2 pr-4 font-medium text-gray-700 dark:text-gray-300">
                                      {detail.fieldName}
                                    </td>
                                    <td className="py-2 pr-4 text-red-600 dark:text-red-400">
                                      {detail.oldValue || "-"}
                                    </td>
                                    <td className="py-2 text-green-600 dark:text-green-400">
                                      {detail.newValue || "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stroke px-4 py-3 dark:border-strokedark">
            <p className="text-sm text-gray-500">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}