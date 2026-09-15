"use client";

import React from "react";
import { StethoscopeIcon, SyringeIcon, MedicalClipboardIcon } from "@/icons/veterinary";
import VitalsOverview, { VitalSignsData } from "./VitalsOverview";

export interface TimelineEvent {
  id: string | number;
  type: "CONSULTATION" | "VACCINE" | "DEWORMING" | "SURGERY";
  date: string;
  title: string;
  subtitle?: string;
  diagnosis?: string | null;
  treatment?: string | null;
  publicNotes?: string | null;
  doctorName?: string | null;
  vitals?: VitalSignsData | null;
}

interface MedicalTimelineProps {
  events: TimelineEvent[];
}

export default function MedicalTimeline({ events }: MedicalTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No hay registros clínicos en la cronología de este paciente.
      </div>
    );
  }

  const getEventBadge = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "CONSULTATION":
        return {
          icon: <StethoscopeIcon className="w-4 h-4" />,
          label: "Consulta Médica",
          bg: "bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60",
          tagBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
        };
      case "VACCINE":
        return {
          icon: <SyringeIcon className="w-4 h-4" />,
          label: "Inmunización",
          bg: "bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950/60",
          tagBg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
        };
      case "DEWORMING":
        return {
          icon: <SyringeIcon className="w-4 h-4" />,
          label: "Desparasitación",
          bg: "bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-950/60",
          tagBg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
        };
      case "SURGERY":
        return {
          icon: <MedicalClipboardIcon className="w-4 h-4" />,
          label: "Cirugía",
          bg: "bg-purple-500 text-white ring-4 ring-purple-100 dark:ring-purple-950/60",
          tagBg: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
        };
    }
  };

  return (
    <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
      {events.map((ev) => {
        const badge = getEventBadge(ev.type);
        const formattedDate = new Date(ev.date).toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        return (
          <div key={`${ev.type}-${ev.id}`} className="relative group">
            {/* Timeline Icon Node */}
            <div
              className={`absolute -left-6 sm:-left-8 top-1.5 w-7 h-7 rounded-full flex items-center justify-center ${badge.bg}`}
            >
              {badge.icon}
            </div>

            {/* Event Content Card */}
            <div className="rounded-2xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-theme-xs p-5 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800/80 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badge.tagBg}`}>
                    {badge.label}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {ev.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formattedDate}</span>
                  {ev.doctorName && (
                    <span>· Dr(a). {ev.doctorName}</span>
                  )}
                </div>
              </div>

              {/* Diagnóstico & Tratamiento */}
              {(ev.diagnosis || ev.treatment) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {ev.diagnosis && (
                    <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                        Diagnóstico Clínico
                      </span>
                      <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                        {ev.diagnosis}
                      </p>
                    </div>
                  )}
                  {ev.treatment && (
                    <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                        Tratamiento Prescrito
                      </span>
                      <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                        {ev.treatment}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Constantes vitales en el evento */}
              {ev.vitals && (
                <div className="mt-4">
                  <VitalsOverview vitals={ev.vitals} />
                </div>
              )}

              {/* Notas del evento */}
              {ev.publicNotes && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
                  &ldquo;{ev.publicNotes}&rdquo;
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
