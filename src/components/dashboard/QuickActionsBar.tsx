import React from "react";
import Link from "next/link";
import { CalenderIcon } from "@/icons";
import { PawIcon, MedicalClipboardIcon, OwnerIcon } from "@/icons/veterinary";

export default function QuickActionsBar() {
  const actions = [
    {
      label: "Nueva Cita",
      desc: "Programar en calendario",
      href: "/calendar",
      icon: <CalenderIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 border-emerald-200/70 dark:border-emerald-800/40",
    },
    {
      label: "Ingresar Paciente",
      desc: "Registrar nueva mascota",
      href: "/mascotas",
      icon: <PawIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      bg: "bg-teal-50 hover:bg-teal-100/80 dark:bg-teal-950/30 dark:hover:bg-teal-900/40 border-teal-200/70 dark:border-teal-800/40",
    },
    {
      label: "Atención Médica",
      desc: "Consultas y vacunas",
      href: "/historial-medico",
      icon: <MedicalClipboardIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bg: "bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 border-blue-200/70 dark:border-blue-800/40",
    },
    {
      label: "Ficha Propietario",
      desc: "Nuevo cliente",
      href: "/clientes",
      icon: <OwnerIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bg: "bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border-amber-200/70 dark:border-amber-800/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      {actions.map((act) => (
        <Link
          key={act.href}
          href={act.href}
          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 shadow-theme-xs ${act.bg}`}
        >
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900/80 shadow-xs flex items-center justify-center flex-shrink-0">
            {act.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {act.label}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {act.desc}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
