import React from "react";

export type SpeciesVariant = "chip" | "icon" | "avatar";

interface SpeciesBadgeProps {
  species: string;
  variant?: SpeciesVariant;
  className?: string;
  showBreed?: string | null;
}

function normalizeSpecies(raw: string): "dog" | "cat" | "bird" | "rabbit" | "fish" | "reptile" | "other" {
  const s = (raw || "").toLowerCase().trim();
  if (s.includes("perr") || s.includes("canin") || s.includes("dog")) return "dog";
  if (s.includes("gat") || s.includes("felin") || s.includes("cat")) return "cat";
  if (s.includes("av") || s.includes("páj") || s.includes("paj") || s.includes("bird") || s.includes("loro")) return "bird";
  if (s.includes("conej") || s.includes("hamster") || s.includes("roedor") || s.includes("cuy")) return "rabbit";
  if (s.includes("pez") || s.includes("pece") || s.includes("fish")) return "fish";
  if (s.includes("rept") || s.includes("tortug") || s.includes("iguana")) return "reptile";
  return "other";
}

function SpeciesIconSvg({ type, className = "w-4 h-4" }: { type: string; className?: string }) {
  switch (type) {
    case "dog":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M10 5.5C9 3 6.5 2 4 3c-.5 2 .5 4.5 2 5.5" />
          <path d="M14 5.5C15 3 17.5 2 20 3c.5 2-.5 4.5-2 5.5" />
          <circle cx="12" cy="14" r="7" />
          <circle cx="9.5" cy="13.5" r="1" fill="currentColor" />
          <circle cx="14.5" cy="13.5" r="1" fill="currentColor" />
          <path d="M11 16.5c.5.5 1.5.5 2 0" />
          <path d="M12 15v1" />
        </svg>
      );
    case "cat":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="m4 4 3 6h10l3-6" />
          <circle cx="12" cy="14" r="7" />
          <circle cx="9.5" cy="13.5" r="1" fill="currentColor" />
          <circle cx="14.5" cy="13.5" r="1" fill="currentColor" />
          <path d="m11 16 1 .5 1-.5" />
          <path d="M7 15H3" />
          <path d="M21 15h-4" />
        </svg>
      );
    case "bird":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M16 7h.01" />
          <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 18Z" />
          <path d="m20 7 2 .5-2 1.5" />
          <path d="M10 18v3" />
          <path d="M14 17.75V21" />
          <path d="M7 18a6 6 0 0 0 3.84-10.61" />
        </svg>
      );
    case "rabbit":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M8 2v8" />
          <path d="M16 2v8" />
          <circle cx="12" cy="15" r="6" />
          <circle cx="10" cy="14" r="1" fill="currentColor" />
          <circle cx="14" cy="14" r="1" fill="currentColor" />
          <path d="m11.5 17 .5.5.5-.5" />
        </svg>
      );
    case "fish":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6-3.56 0-7.56-2.54-8.5-6Z" />
          <path d="M18 10v.01" />
          <path d="M2 16l4.5-4L2 8" />
        </svg>
      );
    case "reptile":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="5" r="2" />
          <path d="M6 10 3 8" />
          <path d="M18 10l3-2" />
          <path d="M7 16l-3 3" />
          <path d="M17 16l3 3" />
          <path d="M12 18v4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <circle cx="8" cy="6" r="2.2" />
          <circle cx="16" cy="6" r="2.2" />
          <circle cx="4.5" cy="11" r="2" />
          <circle cx="19.5" cy="11" r="2" />
          <path d="M12 11.5c-3.2 0-5.8 2.2-5.8 5 0 2.2 2 3.8 5.8 3.8s5.8-1.6 5.8-3.8c0-2.8-2.6-5-5.8-5z" />
        </svg>
      );
  }
}

const colorMap = {
  dog: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
  },
  cat: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800/60",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
  },
  bird: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
  },
  rabbit: {
    bg: "bg-pink-50 dark:bg-pink-950/40",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-800/60",
    iconBg: "bg-pink-100 dark:bg-pink-900/50",
  },
  fish: {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800/60",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
  },
  reptile: {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800/60",
    iconBg: "bg-teal-100 dark:bg-teal-900/50",
  },
  other: {
    bg: "bg-gray-50 dark:bg-gray-800/50",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
    iconBg: "bg-gray-100 dark:bg-gray-800",
  },
};

export default function SpeciesBadge({
  species,
  variant = "chip",
  className = "",
  showBreed,
}: SpeciesBadgeProps) {
  const type = normalizeSpecies(species);
  const colors = colorMap[type];

  if (variant === "avatar") {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl p-2.5 transition-colors ${colors.iconBg} ${colors.text} ${className}`}
        title={species}
      >
        <SpeciesIconSvg type={type} className="w-6 h-6" />
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg p-1.5 ${colors.iconBg} ${colors.text} ${className}`}
        title={species}
      >
        <SpeciesIconSvg type={type} className="w-4 h-4" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      <SpeciesIconSvg type={type} className="w-3.5 h-3.5" />
      <span>{species}</span>
      {showBreed && (
        <span className="opacity-75 font-normal">· {showBreed}</span>
      )}
    </span>
  );
}
