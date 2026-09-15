"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

const defaultColors = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", color: "#3b82f6" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/v1/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingCategory
      ? `/api/v1/categories/${editingCategory.id}`
      : "/api/v1/categories";
    const method = editingCategory ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        fetchCategories();
        resetForm();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({ name: category.name, color: category.color });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta categoría?")) return;

    try {
      const res = await fetch(`/api/v1/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingCategory(null);
    setForm({ name: "", color: "#3b82f6" });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Categorías de Citas
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Administra las categorías disponibles para las citas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
        >
          + Nueva Categoría
        </button>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxgray">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Cargando...</div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay categorías registradas. Crea la primera.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Color
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                        style={{ backgroundColor: category.color }}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      {category.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEdit(category)}
                        className="mr-2 text-sm text-blue-500 hover:text-blue-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Ej: Consulta Veterinaria"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Color de la Categoría *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer dark:bg-boxdark dark:text-white/90"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark font-mono dark:text-white/90"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Colores predefinidos
                </label>
                <div className="flex flex-wrap gap-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${form.color === color
                        ? "border-gray-800 dark:border-white"
                        : "border-transparent"
                        }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
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
                  {editingCategory ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}