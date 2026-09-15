"use client";
import React, { useState, useEffect, useCallback } from "react";
import Button from "../ui/button/Button";

interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

type WeeklySchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

const DAYS: { key: keyof WeeklySchedule; label: string }[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export default function ScheduleEditor() {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/configuracion");
      const data = await res.json();
      if (data.success) {
        setSchedule(data.data.schedule);
      }
    } catch {
      console.error("Error fetching schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
     
    fetchSchedule();
  }, [fetchSchedule]);

  const handleToggle = (key: keyof WeeklySchedule) => {
    if (!schedule) return;
    setSchedule({
      ...schedule,
      [key]: { ...schedule[key], enabled: !schedule[key].enabled },
    });
  };

  const handleTimeChange = (key: keyof WeeklySchedule, field: 'open' | 'close', value: string) => {
    if (!schedule) return;
    setSchedule({
      ...schedule,
      [key]: { ...schedule[key], [field]: value },
    });
  };

  const handleSave = async () => {
    if (!schedule) return;
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch("/api/v1/configuracion/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al guardar");
        return;
      }
      setSuccess("Horario guardado exitosamente");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando horario...</div>;
  }

  if (!schedule) {
    return <div className="text-sm text-red-500">No se pudo cargar el horario.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
          Horarios de atención
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Define el horario semanal de la clínica. Los clientes no podrán agendar fuera de estos horarios o en días cerrados.
        </p>
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

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Día</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Abierto</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Apertura</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Cierre</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map(({ key, label }) => (
              <tr
                key={key}
                className="border-t border-gray-200 dark:border-gray-700"
              >
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                  {label}
                </td>
                <td className="px-4 py-3 text-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule[key].enabled}
                      onChange={() => handleToggle(key)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
                  </label>
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="time"
                    value={schedule[key].open}
                    onChange={(e) => handleTimeChange(key, 'open', e.target.value)}
                    disabled={!schedule[key].enabled}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 disabled:opacity-40 text-gray-800 dark:text-white/90"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="time"
                    value={schedule[key].close}
                    onChange={(e) => handleTimeChange(key, 'close', e.target.value)}
                    disabled={!schedule[key].enabled}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 disabled:opacity-40 text-gray-800 dark:text-white/90"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar horario"}
        </Button>
      </div>
    </div>
  );
}
