"use client";

import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SpeciesBadge from "@/components/common/SpeciesBadge";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PetPassportCard from "@/components/portal/PetPassportCard";

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
  owner: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function MisMascotasPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const res = await fetch("/api/v1/pets");
      const data = await res.json();
      if (data.success) {
        const fetchedPets = data.data.data || [];
        setPets(fetchedPets);
        if (fetchedPets.length > 0) {
          setSelectedPet(fetchedPets[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    if (years < 0) return null;
    if (years === 0 && months === 0) return "Recién nacido";
    if (years === 0) return `${months} meses`;
    if (months === 0) return `${years} años`;
    return `${years} años ${months} meses`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No registrado";
    return new Date(dateStr).toLocaleDateString("es-CL");
  };

  const getSexLabel = (sex: string | null) => {
    if (!sex) return "No especificado";
    const labels: Record<string, string> = {
      MALE: "Macho",
      FEMALE: "Hembra",
    };
    return labels[sex] || sex;
  };

  const getReproductiveLabel = (status: string | null) => {
    if (!status) return "No especificado";
    const labels: Record<string, string> = {
      FERTILE: "Fértil",
      STERILIZED: "Esterilizado/a",
      CASTRATED: "Castrado/a",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Mis Mascotas" />
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-sm text-gray-500 animate-pulse">Cargando mascotas registradas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Mis Mascotas" />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mis Mascotas
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Carnets digitales de salud y control de pacientes asociados a tu cuenta.
        </p>
      </div>

      {pets.length === 0 ? (
        <EmptyState
          title="No tienes mascotas registradas"
          description="Aún no hemos vinculado mascotas a tu cuenta. Contacta a la recepción de la veterinaria para registrar a tu compañero."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lista de mascotas lateral */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Pacientes ({pets.length})
            </h2>
            <div className="space-y-2.5">
              {pets.map((pet) => {
                const isSelected = selectedPet?.id === pet.id;
                return (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPet(pet)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 shadow-theme-xs ring-1 ring-brand-500/20"
                        : "border-gray-200/90 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <SpeciesBadge species={pet.species} variant="icon" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                            {pet.name}
                          </h3>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-brand-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {pet.species} {pet.breed ? `· ${pet.breed}` : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detalle tipo Pet Passport */}
          {selectedPet && (
            <div className="lg:col-span-8">
              <PetPassportCard
                pet={selectedPet}
                formatDate={formatDate}
                calculateAge={calculateAge}
                getSexLabel={getSexLabel}
                getReproductiveLabel={getReproductiveLabel}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
