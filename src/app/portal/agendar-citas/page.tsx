"use client";

import { useEffect, useState } from "react";

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Appointment {
  id: number;
  date: string;
  reason: string;
  categoryId: string;
  category: Category | null;
  status: string;
  pet: {
    id: number;
    name: string;
  };
  vet: {
    firstName: string;
    lastName: string;
  } | null;
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente de confirmación",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistida",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  NO_SHOW: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function AgendarCitasPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    petId: "",
    date: "",
    time: "",
    categoryId: "",
    reason: "",
    notes: "",
  });

  const [publicSettings, setPublicSettings] = useState<{
    schedule: Record<string, { enabled: boolean; open: string; close: string }>;
    upcomingHolidays: Array<{ id: number; date: string; label: string }>;
  } | null>(null);

  const validateLocalSlot = (date: string, time: string): string | null => {
    if (!date || !time || !publicSettings) return null;

    const selected = new Date(`${date}T${time}:00`);
    const now = new Date();
    if (selected < now) return "No se puede seleccionar una fecha pasada.";

    const holiday = publicSettings.upcomingHolidays.find(
      (h) => new Date(h.date).toDateString() === selected.toDateString()
    );
    if (holiday) return `La fecha seleccionada es un día feriado (${holiday.label}).`;

    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayKeys[selected.getDay()];
    const daySchedule = publicSettings.schedule[dayKey];

    if (!daySchedule.enabled) {
      return "La clínica está cerrada ese día.";
    }

    const [openH, openM] = daySchedule.open.split(':').map(Number);
    const [closeH, closeM] = daySchedule.close.split(':').map(Number);
    const minutes = selected.getHours() * 60 + selected.getMinutes();
    const open = openH * 60 + openM;
    const close = closeH * 60 + closeM;

    if (minutes < open || minutes >= close) {
      return `Fuera del horario de atención (${daySchedule.open} - ${daySchedule.close}).`;
    }

    return null;
  };

  const localError = validateLocalSlot(form.date, form.time);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/v1/public/settings");
      const data = await res.json();
      if (data.success) {
        setPublicSettings(data.data);
      }
    } catch (err) {
      console.error("Error fetching public settings:", err);
    }
  };

  const fetchData = async () => {
    try {
      const [petsRes, apptsRes, categoriesRes] = await Promise.all([
        fetch("/api/v1/pets"),
        fetch("/api/v1/appointments"),
        fetch("/api/v1/categories"),
      ]);

      const petsData = await petsRes.json();
      const apptsData = await apptsRes.json();
      const categoriesData = await categoriesRes.json();

      if (petsData.success) {
        setPets(petsData.data.data || []);
      }

      if (apptsData.success) {
        setAppointments(apptsData.data || []);
      }

      if (categoriesData.success && categoriesData.data.length > 0) {
        setCategories(categoriesData.data);
        setForm((prev) => ({ ...prev, categoryId: categoriesData.data[0].id }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.petId || !form.date || !form.time || !form.reason) {
      alert("Por favor complete todos los campos requeridos");
      return;
    }

    const dateTime = `${form.date}T${form.time}:00.000Z`;

    try {
      const res = await fetch("/api/v1/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateTime,
          reason: form.reason,
          categoryId: form.categoryId,
          petId: parseInt(form.petId),
          notes: form.notes || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Cita solicitada exitosamente. Recibirá un email cuando sea confirmada.");
        setShowForm(false);
        setForm({ petId: "", date: "", time: "", categoryId: categories[0]?.id || "", reason: "", notes: "" });
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Error al solicitar la cita");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Agendar Cita
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Solicita una nueva cita para tu mascota
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
        >
          {showForm ? "Cancelar" : "+ Nueva Cita"}
        </button>
      </div>

      {showForm && (
        <div className="p-6 bg-white border border-gray-200/90 rounded-2xl shadow-theme-sm dark:bg-gray-900 dark:border-gray-800">
          <div className="mb-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Solicitar Nueva Cita
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Completa los datos paso a paso para agendar la atención.
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              Paso a paso guiado
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Paso 1: Selección de Mascota */}
            <div>
              <label className="block mb-2 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                1. ¿A quién traes a la consulta? *
              </label>
              {pets.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                  Primero debes registrar una mascota en tu cuenta.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pets.map((pet) => {
                    const isSelected = form.petId === pet.id.toString();
                    return (
                      <button
                        type="button"
                        key={pet.id}
                        onClick={() => setForm({ ...form, petId: pet.id.toString() })}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 ring-1 ring-brand-500"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-800/50"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-brand-100/60 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm">
                          {pet.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {pet.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {pet.species} {pet.breed ? `· ${pet.breed}` : ""}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Paso 2: Motivo y Categoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                  2. Motivo principal *
                </label>
                <select
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Selecciona el motivo</option>
                  <option value="Consulta general">Consulta general</option>
                  <option value="Vacunación">Vacunación</option>
                  <option value="Desparasitación">Desparasitación</option>
                  <option value="Revisión post-tratamiento">Revisión post-tratamiento</option>
                  <option value="Cirugía">Cirugía programada</option>
                  <option value="Emergencia">Urgencia médica</option>
                  <option value="Laboratorio">Análisis de laboratorio</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                  Categoría clínica *
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Paso 3: Fecha y Horario */}
            <div>
              <label className="block mb-2 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                3. Fecha y Bloque Horario *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full px-4 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <select
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="">Selecciona hora disponible</option>
                    {[
                      "08:30", "09:00", "09:30", "10:00", "10:30",
                      "11:00", "11:30", "12:00", "12:30", "13:00",
                      "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
                    ].map((time) => (
                      <option key={time} value={time}>
                        {time} hrs
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {localError && (
              <div className="p-3.5 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900/40">
                {localError}
              </div>
            )}

            <div>
              <label className="block mb-1.5 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                Observaciones para el veterinario
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Describe síntomas, alergias recientes o motivo específico..."
                className="w-full px-4 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm({ petId: "", date: "", time: "", categoryId: categories[0]?.id || "", reason: "", notes: "" });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!!localError || !form.petId}
                className="px-5 py-2 text-sm font-semibold text-white bg-brand-500 rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-theme-xs"
              >
                Confirmar Solicitud
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historial de Citas Solicitadas */}
      <div className="bg-white border border-gray-200/90 rounded-2xl shadow-theme-xs dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base">
            Citas de tus Mascotas
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {appointments.length} atenciones registradas
          </span>
        </div>
        <div className="p-6">
          {appointments.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
              No tienes citas agendadas actualmente. Haz clic en "+ Nueva Cita" para programar una.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-xs flex-shrink-0">
                      {new Date(apt.date).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 text-[11px] font-medium rounded-full"
                          style={{
                            backgroundColor: `${apt.category?.color || "#1b6b53"}15`,
                            color: apt.category?.color || "#1b6b53",
                          }}
                        >
                          {apt.category?.name || "Consulta"}
                        </span>
                        <span className="text-xs text-gray-400">· {formatDate(apt.date)}</span>
                      </div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {apt.reason}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Paciente: <strong className="text-gray-700 dark:text-gray-300">{apt.pet?.name}</strong>
                        {apt.vet && ` · Dr(a). ${apt.vet.firstName} ${apt.vet.lastName}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`self-start sm:self-center px-3 py-1 text-xs font-medium rounded-full ${
                      statusColors[apt.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusLabels[apt.status] || apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}