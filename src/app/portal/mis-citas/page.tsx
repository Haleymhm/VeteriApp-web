"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Appointment {
  id: string;
  date: string;
  reason: string;
  status: string;
  notes: string | null;
  category: Category | null;
  pet: {
    id: string;
    name: string;
    species: string;
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

export default function MisCitasPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/v1/appointments");
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-ES", {
      dateStyle: "full",
      timeStyle: "short",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return "⏳";
      case "CONFIRMED": return "✅";
      case "COMPLETED": return "✓";
      case "CANCELLED": return "✗";
      case "NO_SHOW": return "⚠";
      default: return "•";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (apt) => ["PENDING", "CONFIRMED"].includes(apt.status) && new Date(apt.date) >= new Date()
  );

  const pastAppointments = appointments.filter(
    (apt) => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(apt.status) || new Date(apt.date) < new Date()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Mis Citas
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Revisa el estado de tus citas agendadas
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-lg dark:bg-boxdark dark:border-gray-800">
          <p className="text-gray-500">No tienes citas agendadas.</p>
          <a
            href="/portal/agendar-citas"
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
          >
            Agendar una cita
          </a>
        </div>
      ) : (
        <>
          {upcomingAppointments.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                Próximas Citas
              </h2>
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-boxdark dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getStatusIcon(apt.status)}</span>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white/90">
                            {apt.reason}
                          </p>
                          {apt.category && (
                            <span
                              className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full"
                              style={{
                                backgroundColor: `${apt.category.color}20`,
                                color: apt.category.color,
                              }}
                            >
                              {apt.category.name}
                            </span>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Mascota: {apt.pet?.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(apt.date)}
                          </p>
                          {apt.vet && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Veterinario: Dr. {apt.vet.firstName} {apt.vet.lastName}
                            </p>
                          )}
                          {apt.notes && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          statusColors[apt.status]
                        }`}
                      >
                        {statusLabels[apt.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pastAppointments.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                Historial de Citas
              </h2>
              <div className="space-y-4">
                {pastAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 bg-white border border-gray-100 rounded-lg dark:bg-boxdark dark:border-gray-800 opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{getStatusIcon(apt.status)}</span>
                        <div>
                          <p className="font-medium text-gray-600 dark:text-gray-400">
                            {apt.reason}
                          </p>
                          {apt.category && (
                            <span
                              className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full"
                              style={{
                                backgroundColor: `${apt.category.color}20`,
                                color: apt.category.color,
                              }}
                            >
                              {apt.category.name}
                            </span>
                          )}
                          <p className="text-sm text-gray-400">
                            {apt.pet?.name} • {new Date(apt.date).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          statusColors[apt.status]
                        }`}
                      >
                        {statusLabels[apt.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}