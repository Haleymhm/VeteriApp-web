import React from "react";
import { HeartPulseIcon } from "@/icons/veterinary";

export interface VitalSignsData {
  weight: number | null;
  temperature: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  capillaryRefillTime: string | null;
  dehydrationPercentage: number | null;
  mucousMembranes: string | null;
}

interface VitalsOverviewProps {
  vitals: VitalSignsData | null;
  species?: string;
}

export default function VitalsOverview({ vitals }: VitalsOverviewProps) {
  if (!vitals) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
        No se registraron constantes vitales en esta consulta.
      </div>
    );
  }

  // Clinical evaluation helpers
  const getTempStatus = (t: number | null) => {
    if (t === null) return null;
    if (t < 37.5) return { label: "Hipotermia", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40" };
    if (t > 39.3) return { label: "Febril", color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40" };
    return { label: "Normal", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" };
  };

  const tempStatus = getTempStatus(vitals.temperature);

  return (
    <div className="rounded-2xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-theme-xs">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <HeartPulseIcon className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Constantes Biológicas & Triaje
        </h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Temperatura */}
        <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
            Temperatura
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {vitals.temperature ? `${vitals.temperature} °C` : "—"}
            </span>
            {tempStatus && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tempStatus.color}`}>
                {tempStatus.label}
              </span>
            )}
          </div>
        </div>

        {/* Frecuencia Cardíaca */}
        <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
            Frec. Cardíaca
          </span>
          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
            {vitals.heartRate ? `${vitals.heartRate} lpm` : "—"}
          </p>
        </div>

        {/* Frecuencia Respiratoria */}
        <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
            Frec. Respiratoria
          </span>
          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
            {vitals.respiratoryRate ? `${vitals.respiratoryRate} rpm` : "—"}
          </p>
        </div>

        {/* Peso */}
        <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
            Peso Clínico
          </span>
          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
            {vitals.weight ? `${vitals.weight} kg` : "—"}
          </p>
        </div>
      </div>

      {(vitals.capillaryRefillTime || vitals.mucousMembranes || vitals.dehydrationPercentage !== null) && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
          {vitals.capillaryRefillTime && (
            <span>Tiempo llenado capilar: <strong className="text-gray-700 dark:text-gray-300">{vitals.capillaryRefillTime}</strong></span>
          )}
          {vitals.mucousMembranes && (
            <span>Mucosas: <strong className="text-gray-700 dark:text-gray-300">{vitals.mucousMembranes}</strong></span>
          )}
          {vitals.dehydrationPercentage !== null && (
            <span>Deshidratación: <strong className="text-gray-700 dark:text-gray-300">{vitals.dehydrationPercentage}%</strong></span>
          )}
        </div>
      )}
    </div>
  );
}
