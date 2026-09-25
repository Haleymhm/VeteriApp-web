"use client";

import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventInput, DateSelectArg, EventClickArg, EventMountArg } from "@fullcalendar/core";
import AppointmentPill from "./AppointmentPill";
import { useCalendarContext } from "./CalendarContext";
import styles from "./Calendar.module.css";

interface Vet {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Appointment {
  id: string;
  date: string;
  reason: string;
  status: string;
  notes: string | null;
  petId: string;
  vetId: string | null;
  categoryId: string;
  pet: Pet;
  vet: Vet | null;
  category: {
    id: string;
    name: string;
    color: string;
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
}

const statusColors: Record<string, string> = {
  PENDING: "#EF4444",
  CONFIRMED: "#10B981",
  COMPLETED: "#6B7280",
  CANCELLED: "#94A3B8",
  NO_SHOW: "#8B5CF6",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistida",
};

export interface CalendarProps {
  onOpenCreateModal?: () => void;
  onOpenPendingModal?: () => void;
  externalAppointments?: Appointment[];
  setExternalAppointments?: (appts: Appointment[]) => void;
}

export default function Calendar({ onOpenCreateModal, onOpenPendingModal, externalAppointments, setExternalAppointments }: CalendarProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(externalAppointments || []);
  const [vets, setVets] = useState<Vet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);

  const ctx = useCalendarContext();

  const [form, setForm] = useState({
    date: "",
    time: "",
    categoryId: "",
    reason: "",
    petId: "",
    vetId: "",
    notes: "",
  });

  useEffect(() => {
    fetchAppointments();
    fetchVets();
    fetchAllPets();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (externalAppointments && setExternalAppointments) {
      setAppointments(externalAppointments);
    }
  }, [externalAppointments, setExternalAppointments]);

  const fetchAllPets = async () => {
    try {
      const res = await fetch("/api/v1/pets");
      const data = await res.json();
      if (data.success) {
        setAllPets(data.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/v1/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
        if (data.data && data.data.length > 0) {
          setForm((prev) => ({ ...prev, categoryId: data.data[0].id }));
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/v1/appointments");
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data);
        ctx.setAppointments(data.data);
        if (setExternalAppointments) {
          setExternalAppointments(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVets = async () => {
    try {
      const res = await fetch("/api/v1/vets");
      const data = await res.json();
      if (data.success) {
        setVets(data.data);
      }
    } catch (error) {
      console.error("Error fetching vets:", error);
    }
  };

  const events: EventInput[] = appointments.map((apt) => ({
    id: apt.id,
    title: `${apt.category?.name || "Sin categoría"}: ${apt.pet?.name} - ${apt.reason}`,
    start: apt.date,
    backgroundColor: `${apt.category?.color || "#6b7280"}15`,
    borderColor: apt.category?.color || "#6b7280",
    borderWidth: 2,
    textColor: "#1A1A1A",
    extendedProps: {
      appointment: apt,
      status: apt.status,
      categoryColor: apt.category?.color || "#6b7280",
    },
    classNames: [`fc-event-status-${apt.status.toLowerCase()}`],
  }));

  const renderEventContent = (eventInfo: { event: { extendedProps: { status: string; categoryColor: string; appointment: Appointment } } }) => {
    const { status, categoryColor, appointment } = eventInfo.event.extendedProps;
    return (
      <div className="flex items-center gap-2 py-1 px-2 overflow-hidden">
        <AppointmentPill status={status} categoryColor={categoryColor} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xs truncate dark:text-gray-100">
            {appointment.pet?.name}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
            {appointment.category?.name}
          </p>
        </div>
      </div>
    );
  };

  const handleEventDidMount = (mountInfo: EventMountArg) => {
    const { status } = mountInfo.event.extendedProps;
    const statusClass = `fc-event-status-${status.toLowerCase()}`;
    mountInfo.el.classList.add(statusClass);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetForm();
    const dateStr = selectInfo.startStr.split("T")[0];
    const timeStr = selectInfo.startStr.split("T")[1]?.substring(0, 5) || "09:00";
    setForm((prev) => ({
      ...prev,
      date: dateStr,
      time: timeStr,
    }));
    setShowModal(true);
    if (onOpenCreateModal) {
      onOpenCreateModal();
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const apt = clickInfo.event.extendedProps.appointment as Appointment;
    setSelectedAppointment(apt);
    setShowDetailModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dateTime = `${form.date}T${form.time}:00.000Z`;

    const payload = {
      date: dateTime,
      reason: form.reason,
      categoryId: form.categoryId,
      petId: form.petId,
      vetId: form.vetId || null,
      notes: form.notes || null,
      status: "CONFIRMED",
    };

    try {
      const res = await fetch("/api/v1/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        fetchAppointments();
        setShowModal(false);
        resetForm();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/v1/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        fetchAppointments();
        setShowDetailModal(false);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta cita?")) return;

    try {
      const res = await fetch(`/api/v1/appointments/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        fetchAppointments();
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  };

  const resetForm = () => {
    setForm({
      date: "",
      time: "",
      categoryId: categories[0]?.id || "",
      reason: "",
      petId: "",
      vetId: "",
      notes: "",
    });
  };

  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <button
          onClick={() => {
            setShowPendingModal(true);
            if (onOpenPendingModal) {
              onOpenPendingModal();
            }
          }}
          className="w-full p-4 mb-4 text-left bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
        >
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>{pendingCount}</strong> cita{pendingCount > 1 ? "s" : ""} pendiente{pendingCount > 1 ? "s" : ""} de confirmar - Click para ver
          </p>
        </button>
      )}

      <div className={styles.calendarWrapper}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          eventDidMount={handleEventDidMount}
          height="auto"
          locale="es"
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg p-6 bg-white rounded-lg dark:bg-boxdark max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Nueva Cita
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Hora *
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Mascota *
                </label>
                <select
                  value={form.petId}
                  onChange={(e) => setForm({ ...form, petId: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark"
                >
                  <option value="">Seleccionar mascota</option>
                  {allPets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.owner.firstName} {pet.owner.lastName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Veterinario
                </label>
                <select
                  value={form.vetId}
                  onChange={(e) => setForm({ ...form, vetId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark"
                >
                  <option value="">Sin asignar</option>
                  {vets.map((vet) => (
                    <option key={vet.id} value={vet.id}>
                      Dr. {vet.firstName} {vet.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Categoría *
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Motivo de consulta *
                </label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                  placeholder="Ej: Revisión general, corte de pelo..."
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Notas adicionales
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-400 dark:border-strokedark dark:hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
                >
                  Crear Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50  dark:border-b-gray-100">
          <div className="w-full max-w-lg p-6 bg-white rounded-lg dark:bg-boxdark dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Detalle de Cita
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Estado:</span>
                <span
                  className="px-2 py-1 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: `${statusColors[selectedAppointment.status]}20`,
                    color: statusColors[selectedAppointment.status],
                  }}
                >
                  {statusLabels[selectedAppointment.status]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Categoría:</span>
                <span
                  className="px-2 py-1 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: `${selectedAppointment.category?.color || "#6b7280"}20`,
                    color: selectedAppointment.category?.color || "#6b7280",
                  }}
                >
                  {selectedAppointment.category?.name || "Sin categoría"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Fecha:</span>
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {new Date(selectedAppointment.date).toLocaleString("es-ES")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Mascota:</span>
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {selectedAppointment.pet?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Cliente:</span>
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {selectedAppointment.pet?.owner?.firstName} {selectedAppointment.pet?.owner?.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Veterinario:</span>
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {selectedAppointment.vet
                    ? `Dr. ${selectedAppointment.vet.firstName} ${selectedAppointment.vet.lastName}`
                    : "Sin asignar"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Motivo:</span>
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {selectedAppointment.reason}
                </span>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <span className="text-sm text-gray-500">Notas:</span>
                  <p className="mt-1 text-sm text-gray-800 dark:text-white/90">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-400">
                Acciones
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedAppointment.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedAppointment.id, "CONFIRMED")}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded hover:bg-green-600"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedAppointment.id, "CANCELLED")}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {selectedAppointment.status === "CONFIRMED" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedAppointment.id, "COMPLETED")}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-gray-500 rounded hover:bg-gray-600"
                    >
                      Marcar Completada
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedAppointment.id, "NO_SHOW")}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-purple-500 rounded hover:bg-purple-600"
                    >
                      No Asistió
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedAppointment.id, "CANCELLED")}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(selectedAppointment.id)}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAppointment(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-400 dark:border-strokedark dark:hover:bg-white/5"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg dark:bg-boxdark max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Citas Pendientes de Confirmar ({pendingCount})
              </h3>
              <button
                onClick={() => setShowPendingModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {appointments.filter((a) => a.status === "PENDING").length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay citas pendientes</p>
            ) : (
              <div className="space-y-3">
                {appointments
                  .filter((a) => a.status === "PENDING")
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="p-4 border border-stroke rounded-lg dark:border-strokedark bg-white dark:bg-boxgray hover:border-amber-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="px-2 py-0.5 text-xs font-medium rounded-full"
                              style={{
                                backgroundColor: `${apt.category?.color || "#6b7280"}20`,
                                color: apt.category?.color || "#6b7280",
                              }}
                            >
                              {apt.category?.name || "Sin categoría"}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              Pendiente
                            </span>
                          </div>
                          <p className="font-medium text-gray-800 dark:text-white/90">
                            {apt.pet?.name} - {apt.reason}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Cliente: {apt.pet?.owner?.firstName} {apt.pet?.owner?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(apt.date).toLocaleString("es-ES", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                          {apt.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                              Nota: {apt.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => handleStatusChange(apt.id, "CONFIRMED")}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded hover:bg-green-600 whitespace-nowrap"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleStatusChange(apt.id, "CANCELLED")}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 whitespace-nowrap"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setShowPendingModal(false);
                              setShowDetailModal(true);
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 dark:text-gray-400 dark:border-strokedark dark:hover:bg-white/5 whitespace-nowrap"
                          >
                            Ver Detalle
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex justify-end mt-6 pt-4 border-t border-stroke dark:border-strokedark">
              <button
                onClick={() => setShowPendingModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-400 dark:border-strokedark dark:hover:bg-white/5"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}