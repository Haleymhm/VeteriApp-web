"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface CalendarAppointment {
  id: string;
  date: string;
  reason: string;
  status: string;
  notes: string | null;
  petId: string;
  vetId: string | null;
  categoryId: string;
  pet: {
    id: string;
    name: string;
    species: string;
    owner: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  vet: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  category: {
    id: string;
    name: string;
    color: string;
  };
}

interface CalendarContextValue {
  appointments: CalendarAppointment[];
  setAppointments: (appointments: CalendarAppointment[]) => void;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  showPendingModal: boolean;
  setShowPendingModal: (show: boolean) => void;
  pendingCount: number;
  refreshAppointments: () => Promise<void>;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendarContext must be used within CalendarProvider");
  }
  return context;
}

interface CalendarProviderProps {
  children: ReactNode;
  initialAppointments?: CalendarAppointment[];
}

export function CalendarProvider({ children, initialAppointments = [] }: CalendarProviderProps) {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>(initialAppointments);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;

  const refreshAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/appointments");
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  }, []);

  return (
    <CalendarContext.Provider
      value={{
        appointments,
        setAppointments,
        showCreateModal,
        setShowCreateModal,
        showPendingModal,
        setShowPendingModal,
        pendingCount,
        refreshAppointments,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}