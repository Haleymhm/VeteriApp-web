"use client";
import React, { useState, useEffect, useCallback } from "react";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";

interface Holiday {
  id: number;
  date: string;
  label: string;
  createdAt: string;
}

export default function HolidaysEditor() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchHolidays = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/configuracion");
      const data = await res.json();
      if (data.success) {
        setHolidays(data.data.holidays || []);
      }
    } catch {
      console.error("Error fetching holidays");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHolidays();
  }, [fetchHolidays]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const isoDate = new Date(`${date}T00:00:00.000Z`).toISOString();
      const res = await fetch("/api/v1/configuracion/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: isoDate, label }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al crear feriado");
        return;
      }
      setSuccess("Feriado agregado");
      setLabel("");
      setDate("");
      setShowForm(false);
      fetchHolidays();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este feriado?")) return;
    try {
      const res = await fetch(`/api/v1/configuracion/holidays/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchHolidays();
      } else {
        alert(data.error);
      }
    } catch {
      console.error("Error deleting holiday");
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando feriados...</div>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureHolidays = holidays.filter((h) => new Date(h.date) >= today);
  const pastHolidays = holidays.filter((h) => new Date(h.date) < today);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
            Días feriados
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Días no laborables donde la clínica no atiende. Los clientes no podrán agendar en estas fechas.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "+ Agregar feriado"}
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg dark:bg-red-900/20">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg dark:bg-green-900/20">
          {success}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>
                Fecha <span className="text-red-500">*</span>
              </Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full h-11 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white/90"
              />
            </div>
            <div>
              <Label>
                Etiqueta <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej: Navidad"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar feriado"}
            </Button>
          </div>
        </form>
      )}

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Próximos feriados ({futureHolidays.length})
        </h4>
        {futureHolidays.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No hay feriados próximos.</p>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Fecha</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Etiqueta</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700 dark:text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {futureHolidays.map((h) => (
                  <tr key={h.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2 text-gray-800 dark:text-white/90">
                      {new Date(h.date).toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{h.label}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
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

      {pastHolidays.length > 0 && (
        <details className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            Feriados pasados ({pastHolidays.length})
          </summary>
          <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
            {pastHolidays.map((h) => (
              <div key={h.id} className="flex justify-between">
                <span>{new Date(h.date).toLocaleDateString("es-CL")} - {h.label}</span>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="text-red-500 text-xs"
                >
                  eliminar
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
