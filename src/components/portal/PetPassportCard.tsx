"use client";

import React, { useState } from "react";
import Link from "next/link";
import SpeciesBadge from "@/components/common/SpeciesBadge";
import { CopyIcon } from "@/icons";

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weight: number | null;
  sex: string | null;
  reproductiveStatus: string | null;
  specialCharacteristics: string | null;
  microchipNumber: string | null;
  createdAt: string;
}

interface PetPassportCardProps {
  pet: Pet;
  formatDate: (dateStr: string | null) => string;
  calculateAge: (birthDate: string | null) => string | null;
  getSexLabel: (sex: string | null) => string;
  getReproductiveLabel: (status: string | null) => string;
}

export default function PetPassportCard({
  pet,
  formatDate,
  calculateAge,
  getSexLabel,
  getReproductiveLabel,
}: PetPassportCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyChip = () => {
    if (!pet.microchipNumber) return;
    navigator.clipboard.writeText(pet.microchipNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const age = calculateAge(pet.birthDate);

  return (
    <div className="rounded-2xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-theme-sm overflow-hidden">
      {/* Header tipo pasaporte clínico con degradado orgánico suave */}
      <div className="relative px-6 pt-6 pb-5 bg-gradient-to-r from-brand-50/70 via-emerald-50/40 to-transparent dark:from-brand-950/40 dark:via-emerald-950/20 dark:to-transparent border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SpeciesBadge species={pet.species} variant="avatar" className="w-16 h-16 shadow-xs" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pet.name}
                </h2>
                <SpeciesBadge species={pet.species} variant="chip" showBreed={pet.breed} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Carnet Digital de Paciente #{pet.id.toString().padStart(5, "0")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/portal/agendar-citas?petId=${pet.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-theme-xs"
            >
              Agendar Control
            </Link>
            <Link
              href={`/portal/historial-medico?petId=${pet.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
            >
              Ver Ficha
            </Link>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Clínicas Principales */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span className="text-[11px] font-medium tracking-wide uppercase text-gray-400 dark:text-gray-500">
              Edad Estimada
            </span>
            <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white">
              {age || "No registrada"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span className="text-[11px] font-medium tracking-wide uppercase text-gray-400 dark:text-gray-500">
              Peso Actual
            </span>
            <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white">
              {pet.weight ? `${pet.weight} kg` : "Sin registro"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span className="text-[11px] font-medium tracking-wide uppercase text-gray-400 dark:text-gray-500">
              Sexo Biológico
            </span>
            <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white">
              {getSexLabel(pet.sex)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span className="text-[11px] font-medium tracking-wide uppercase text-gray-400 dark:text-gray-500">
              Reproductivo
            </span>
            <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white">
              {getReproductiveLabel(pet.reproductiveStatus)}
            </p>
          </div>
        </div>

        {/* Microchip y fecha de nacimiento */}
        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-mono text-xs">
              ID
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Microchip Oficial</p>
              <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                {pet.microchipNumber || "Sin microchip registrado"}
              </p>
            </div>
          </div>

          {pet.microchipNumber && (
            <button
              onClick={handleCopyChip}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
            >
              <CopyIcon className="w-3.5 h-3.5" />
              <span>{copied ? "¡Copiado!" : "Copiar Chip"}</span>
            </button>
          )}
        </div>

        {/* Notas y Características Especiales */}
        {pet.specialCharacteristics && (
          <div className="p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide mb-1">
              Observaciones Clínicas / Cuidados Especiales
            </p>
            <p className="text-sm text-amber-900/90 dark:text-amber-200/90">
              {pet.specialCharacteristics}
            </p>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Fecha de Nacimiento: {formatDate(pet.birthDate)}</span>
          <span>Inscrito el {formatDate(pet.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
