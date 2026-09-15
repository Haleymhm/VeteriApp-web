"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  VET: "Veterinario",
  RECEPTIONIST: "Recepcionista",
  CLIENT: "Cliente",
  ADMIN: "Administrador",
};

const roleColors: Record<string, string> = {
  VET: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  RECEPTIONIST: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  CLIENT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "RECEPTIONIST",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/v1/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser
      ? `/api/v1/users/${editingUser.id}`
      : "/api/v1/users";
    const method = editingUser ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        fetchUsers();
        resetForm();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      password: "",
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este usuario?")) return;

    try {
      const res = await fetch(`/api/v1/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "RECEPTIONIST",
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Gestión de Usuarios
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
        >
          + Nuevo Usuario
        </button>
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
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Rol
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
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role] || "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(user)}
                          className="mr-2 text-sm text-blue-500 hover:text-blue-600"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
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
          <div className="w-full max-w-md p-6 bg-white rounded-lg dark:bg-boxdark">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nombre
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
                  Apellido
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
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Email
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
                  Contraseña {editingUser && "(dejar vacío para no cambiar)"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required={!editingUser}
                  minLength={8}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Rol
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                >
                  <option value="VET">Veterinario</option>
                  <option value="RECEPTIONIST">Recepcionista</option>
                </select>
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
                  {editingUser ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}