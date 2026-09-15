"use client";

import { useEffect, useState } from "react";

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
}

interface Client {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  rut: string;
  phone: string | null;
  address: string | null;
  regionId: string | null;
  comunaId: string | null;
  role: string;
  createdAt: string;
  pets: { id: number; name: string; species: string }[];
  region?: { id: string; name: string };
  comuna?: { id: string; name: string };
}

interface ApiResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    rut: "",
    phone: "",
    address: "",
    regionId: "",
    comunaId: "",
  });

  useEffect(() => {
    fetchClients();
    fetchRegions();
  }, [search]);

  useEffect(() => {
    if (form.regionId) {
      fetchComunas(form.regionId);
    } else {
      setComunas([]);
    }
  }, [form.regionId]);

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/clients?${params}`);
      const data = await res.json();
      if (data.success) {
        const response = data.data as ApiResponse;
        setClients(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
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

  const fetchComunas = async (regionId: string) => {
    try {
      const res = await fetch(`/api/v1/comunas?regionId=${regionId}`);
      const data = await res.json();
      if (data.success) {
        setComunas(data.data);
      }
    } catch (error) {
      console.error("Error fetching comunas:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingClient
      ? `/api/v1/clients/${editingClient.id}`
      : "/api/v1/clients";
    const method = editingClient ? "PUT" : "POST";

    const submitData = {
      ...form,
      phone: form.phone || null,
      address: form.address || null,
      regionId: form.regionId || null,
      comunaId: form.comunaId || null,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      const data = await res.json();

      if (data.success) {
        fetchClients();
        resetForm();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error saving client:", error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      email: client.email,
      password: "",
      firstName: client.firstName,
      lastName: client.lastName,
      rut: client.rut || "",
      phone: client.phone || "",
      address: client.address || "",
      regionId: client.regionId || "",
      comunaId: client.comunaId || "",
    });
    if (client.regionId) {
      fetchComunas(client.regionId);
    }
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este cliente?")) return;

    try {
      const res = await fetch(`/api/v1/clients/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchClients();
      }
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingClient(null);
    setForm({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      rut: "",
      phone: "",
      address: "",
      regionId: "",
      comunaId: "",
    });
    setComunas([]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Gestión de Clientes
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
        >
          + Nuevo Cliente
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, email o RUT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark w-full max-w-xs"
        />
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxgray">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    RUT
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Ubicación
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Mascotas
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Fecha de Registro
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      No hay clientes registrados
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
                        {client.firstName} {client.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                        {client.rut || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {client.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {client.phone || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {client.comuna?.name
                          ? `${client.comuna.name}, ${client.region?.name || ""}`
                          : client.region?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {client.pets && client.pets.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {client.pets.map((pet) => (
                              <span
                                key={pet.id}
                                className="px-2 py-0.5 text-xs bg-gray-100 rounded dark:bg-gray-800 dark:text-white/90"
                              >
                                {pet.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sin mascotas</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(client.createdAt).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(client)}
                          className="mr-2 text-sm text-blue-500 hover:text-blue-600"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg p-6 bg-white rounded-lg dark:bg-boxdark max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  RUT *
                </label>
                <input
                  type="text"
                  value={form.rut}
                  onChange={(e) =>
                    setForm({ ...form, rut: e.target.value })
                  }
                  required
                  placeholder="Ej: 12.345.678-9"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Contraseña {editingClient && "(dejar vacío para no cambiar)"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required={!editingClient}
                  minLength={8}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="Ej: +56 9 1234 5678"
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Región
                  </label>
                  <select
                    value={form.regionId}
                    onChange={(e) =>
                      setForm({ ...form, regionId: e.target.value, comunaId: "" })
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                  >
                    <option value="">Seleccione región</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Comuna
                  </label>
                  <select
                    value={form.comunaId}
                    onChange={(e) =>
                      setForm({ ...form, comunaId: e.target.value })
                    }
                    disabled={!form.regionId}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark disabled:opacity-50 dark:text-white/90"
                  >
                    <option value="">Seleccione comuna</option>
                    {comunas.map((comuna) => (
                      <option key={comuna.id} value={comuna.id}>
                        {comuna.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Ej: Av. Principal 123"
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                  />
                </div>
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
                  {editingClient ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}