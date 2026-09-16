"use client";

import React, { useEffect, useState } from "react";

interface Region {
  id: string;
  code: string;
  name: string;
}

interface Comuna {
  id: string;
  code: string;
  name: string;
  regionId: string;
  region: Region;
  createdAt: string;
}

export default function ComunasPage() {
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingComuna, setEditingComuna] = useState<Comuna | null>(null);
  const [form, setForm] = useState({ code: "", name: "", regionId: "" });
  const [error, setError] = useState("");
  const [filterRegion, setFilterRegion] = useState("");

  useEffect(() => {
    fetchComunas();
    fetchRegions();
  }, [filterRegion]);

  const fetchComunas = async () => {
    try {
      const params = new URLSearchParams();
      if (filterRegion) {
        params.set("regionId", filterRegion);
      }
      const res = await fetch(`/api/v1/comunas?${params}`);
      const data = await res.json();
      if (data.success) {
        setComunas(data.data);
      }
    } catch (error) {
      console.error("Error fetching comunas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const res = await fetch("/api/v1/regions");
      const data = await res.json();
      if (data.success) {
        setRegions(data.data);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.regionId) {
      setError("Debe seleccionar una región");
      return;
    }

    const url = editingComuna
      ? `/api/v1/comunas/${editingComuna.id}`
      : "/api/v1/comunas";
    const method = editingComuna ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        fetchComunas();
        resetForm();
      } else {
        setError(data.error || "Ocurrió un error al guardar la comuna");
      }
    } catch (error) {
      console.error("Error saving comuna:", error);
      setError("Error de red al intentar guardar la comuna");
    }
  };

  const handleEdit = (comuna: Comuna) => {
    setEditingComuna(comuna);
    setForm({
      code: comuna.code,
      name: comuna.name,
      regionId: comuna.regionId,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta comuna?")) return;

    try {
      const res = await fetch(`/api/v1/comunas/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchComunas();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting comuna:", error);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingComuna(null);
    setForm({ code: "", name: "", regionId: "" });
    setError("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Comunas
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Administra las comunas de cada región
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
        >
          + Nueva Comuna
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="w-full max-w-xs">
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="px-4 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark w-full"
          >
            <option value="">Todas las regiones</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name} ({region.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxgray">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Cargando...</div>
        ) : comunas.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay comunas registradas. Crea la primera.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 w-1/4">
                    Código Comuna
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">
                    Nombre Comuna
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 w-1/4">
                    Región
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400 w-1/6">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {comunas.map((comuna) => (
                  <tr
                    key={comuna.id}
                    className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-800 dark:text-white/90">
                      {comuna.code}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {comuna.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {comuna.region ? (
                        <span>
                          {comuna.region.name} (
                          <span className="font-mono text-xs">
                            {comuna.region.code}
                          </span>
                          )
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(comuna)}
                        className="mr-3 text-sm text-blue-500 hover:text-blue-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(comuna.id)}
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
              {editingComuna ? "Editar Comuna" : "Nueva Comuna"}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 text-red-500 text-sm dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Región Asociada *
                </label>
                <select
                  value={form.regionId}
                  onChange={(e) => setForm({ ...form, regionId: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                >
                  <option value="">Seleccione una región</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name} ({region.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Código de la Comuna *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                  placeholder="Ej: COM-13101"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nombre de la Comuna *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Ej: Santiago"
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
                  {editingComuna ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
