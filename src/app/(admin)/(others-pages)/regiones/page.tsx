"use client";

import React, { useEffect, useState } from "react";

interface Region {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export default function RegionesPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [form, setForm] = useState({ code: "", name: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const res = await fetch("/api/v1/regions");
      const data = await res.json();
      if (data.success) {
        setRegions(data.data);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const url = editingRegion
      ? `/api/v1/regions/${editingRegion.id}`
      : "/api/v1/regions";
    const method = editingRegion ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        fetchRegions();
        resetForm();
      } else {
        setError(data.error || "Ocurrió un error al guardar la región");
      }
    } catch (error) {
      console.error("Error saving region:", error);
      setError("Error de red al intentar guardar la región");
    }
  };

  const handleEdit = (region: Region) => {
    setEditingRegion(region);
    setForm({ code: region.code, name: region.name });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta región? Esto no se podrá deshacer.")) return;

    try {
      const res = await fetch(`/api/v1/regions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchRegions();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting region:", error);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingRegion(null);
    setForm({ code: "", name: "" });
    setError("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Regiones
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Administra las regiones del sistema
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
        >
          + Nueva Región
        </button>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxgray">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Cargando...</div>
        ) : regions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay regiones registradas. Crea la primera.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 w-1/4">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 w-1/2">
                    Nombre Región
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400 w-1/4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {regions.map((region) => (
                  <tr
                    key={region.id}
                    className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-800 dark:text-white/90">
                      {region.code}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {region.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(region)}
                        className="mr-3 text-sm text-blue-500 hover:text-blue-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(region.id)}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg dark:bg-boxdark">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              {editingRegion ? "Editar Región" : "Nueva Región"}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 text-red-500 text-sm dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Código de la Región *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                  placeholder="Ej: REG-13"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nombre de la Región *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Ej: Metropolitana de Santiago"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-400 dark:border-strokedark dark:hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
                >
                  {editingRegion ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
