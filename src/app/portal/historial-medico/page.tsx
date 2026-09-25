"use client";

import { useEffect, useState } from "react";
import { generateMedicalHistoryPDF } from "@/lib/medical-history-pdf";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
}

interface MedicalRecord {
  id: string;
  date: string;
  title: string;
  diagnosis: string | null;
  treatment: string | null;
  publicNotes: string;
  pet: { id: string; name: string; species: string };
  vet: { firstName: string; lastName: string };
  vitals: {
    weight: number | null;
    temperature: number | null;
    heartRate: number | null;
    respiratoryRate: number | null;
  } | null;
  createdAt: string;
}

interface Vaccination {
  id: string;
  vaccineName: string;
  vaccineType: string;
  administrationDate: string;
  nextDoseDate: string | null;
}

interface Deworming {
  id: string;
  productName: string;
  type: string;
  date: string;
  nextDate: string | null;
}

interface ChronicCondition {
  id: string;
  name: string;
  type: string;
  severity: string | null;
  isActive: boolean;
  notes: string | null;
}

type TabType = "consultas" | "vacunas" | "desparasitacion" | "condiciones";

export default function HistorialMedicoPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("consultas");
  const [loading, setLoading] = useState(false);

  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [dewormingRecords, setDewormingRecords] = useState<Deworming[]>([]);
  const [chronicConditions, setChronicConditions] = useState<ChronicCondition[]>([]);

  // Leer petId del query string al cargar (viene desde /portal/mis-mascotas)
  useEffect(() => {
    fetchPetsAndSelectDefault();
  }, []);

  useEffect(() => {
    if (selectedPetId) {
      fetchMedicalData();
    }
  }, [selectedPetId]);

  const fetchPetsAndSelectDefault = async () => {
    try {
      const res = await fetch("/api/v1/pets");
      const data = await res.json();
      if (data.success) {
        const allPets = data.data.data || [];
        setPets(allPets);
        if (allPets.length > 0) {
          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const petIdFromUrl = params.get("petId");
            if (petIdFromUrl) {
              if (allPets.some((p: Pet) => p.id === petIdFromUrl)) {
                setSelectedPetId(petIdFromUrl);
              } else {
                setSelectedPetId(allPets[0].id);
              }
            } else {
              setSelectedPetId(allPets[0].id);
            }
          } else {
            setSelectedPetId(allPets[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
    }
  };

  const fetchMedicalData = async () => {
    if (!selectedPetId) return;
    setLoading(true);
    try {
      const [mrRes, vacRes, dewRes, ccRes] = await Promise.all([
        fetch(`/api/v1/medical-records?petId=${selectedPetId}`),
        fetch(`/api/v1/pets/${selectedPetId}/vaccinations`),
        fetch(`/api/v1/pets/${selectedPetId}/deworming`),
        fetch(`/api/v1/pets/${selectedPetId}/chronic-conditions`),
      ]);

      const mrData = await mrRes.json();
      const vacData = await vacRes.json();
      const dewData = await dewRes.json();
      const ccData = await ccRes.json();

      if (mrData.success) setMedicalRecords(mrData.data || []);
      if (vacData.success) setVaccinations(vacData.data || []);
      if (dewData.success) setDewormingRecords(dewData.data || []);
      if (ccData.success) setChronicConditions(ccData.data || []);
    } catch (error) {
      console.error("Error fetching medical data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-CL");
  };

  const getSpeciesIcon = (species: string) => {
    const s = species.toLowerCase();
    if (s.includes("perro")) return "🐕";
    if (s.includes("gato")) return "🐈";
    return "🐾";
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "consultas", label: "Consultas" },
    { key: "vacunas", label: "Vacunas" },
    { key: "desparasitacion", label: "Desparasitación" },
    { key: "condiciones", label: "Alergias/Patologías" },
  ];

  const selectedPet = pets.find((p) => p.id === selectedPetId);

  const handleDownloadPDF = async () => {
    if (!selectedPet) return;

    const pdfData = {
      pet: {
        id: selectedPet.id,
        name: selectedPet.name,
        species: selectedPet.species,
        breed: selectedPet.breed,
        birthDate: null,
        weight: null,
        sex: null,
        owner: { firstName: "", lastName: "", email: "" },
      },
      vaccinations: vaccinations.map((v) => ({
        vaccineName: v.vaccineName,
        vaccineType: v.vaccineType,
        administrationDate: v.administrationDate,
        nextDoseDate: v.nextDoseDate,
        lotNumber: null,
        manufacturer: null,
      })),
      deworming: dewormingRecords.map((d) => ({
        productName: d.productName,
        type: d.type,
        date: d.date,
        nextDate: d.nextDate,
        dosage: null,
      })),
      surgicalHistory: [],
      chronicConditions: chronicConditions.map((c) => ({
        name: c.name,
        type: c.type,
        severity: c.severity,
        diagnosisDate: null,
        notes: c.notes,
        isActive: c.isActive,
      })),
      medicalRecords: medicalRecords.map((m) => ({
        id: m.id,
        date: m.date,
        title: m.title,
        diagnosis: m.diagnosis,
        treatment: m.treatment,
        publicNotes: m.publicNotes,
        vet: m.vet,
        vitals: m.vitals,
      })),
    };

    await generateMedicalHistoryPDF(pdfData);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-6">
        Historial Médico
      </h1>

      {pets.length > 0 && (
        <div className="mb-6 flex items-center gap-4">
          <select
            value={selectedPetId || ""}
            onChange={(e) => setSelectedPetId(e.target.value || null)}
            className="px-4 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark min-w-[250px]"
          >
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {getSpeciesIcon(pet.species)} {pet.name} ({pet.species})
              </option>
            ))}
          </select>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar PDF
          </button>
        </div>
      )}

      {selectedPet && (
        <>
          <div className="mb-6 p-4 rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getSpeciesIcon(selectedPet.species)}</span>
              <div>
                <h2 className="font-semibold text-brand-700 dark:text-brand-400">
                  {selectedPet.name}
                </h2>
                <p className="text-sm text-brand-600 dark:text-brand-500">
                  {selectedPet.species} {selectedPet.breed && `- ${selectedPet.breed}`}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-brand-500 text-brand-500"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxgray">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Cargando...</div>
            ) : (
              <div className="p-4">
                {activeTab === "consultas" && (
                  <div className="space-y-4">
                    {medicalRecords.length === 0 ? (
                      <p className="text-center text-gray-500 py-6">
                        No hay consultas registradas aún
                      </p>
                    ) : (
                      medicalRecords.map((m) => (
                        <div
                          key={m.id}
                          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="mb-2">
                            <h4 className="font-medium text-gray-800 dark:text-white/90">
                              {m.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {formatDate(m.date)} | Dr. {m.vet.firstName} {m.vet.lastName}
                            </p>
                          </div>
                          {m.vitals && (
                            <div className="grid grid-cols-4 gap-2 mb-3 p-2 bg-gray-50 dark:bg-white/5 rounded text-center">
                              <div>
                                <p className="text-xs text-gray-500">Peso</p>
                                <p className="text-sm font-medium">
                                  {m.vitals.weight ? `${m.vitals.weight} kg` : "-"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Temp</p>
                                <p className="text-sm font-medium">
                                  {m.vitals.temperature ? `${m.vitals.temperature} °C` : "-"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">FC</p>
                                <p className="text-sm font-medium">
                                  {m.vitals.heartRate ? `${m.vitals.heartRate} lpm` : "-"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">FR</p>
                                <p className="text-sm font-medium">
                                  {m.vitals.respiratoryRate ? `${m.vitals.respiratoryRate} rpm` : "-"}
                                </p>
                              </div>
                            </div>
                          )}
                          {m.diagnosis && (
                            <p className="text-sm mb-1">
                              <span className="font-medium">Diagnóstico:</span> {m.diagnosis}
                            </p>
                          )}
                          {m.treatment && (
                            <p className="text-sm mb-1">
                              <span className="font-medium">Tratamiento:</span> {m.treatment}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {m.publicNotes}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "vacunas" && (
                  <div className="space-y-3">
                    {vaccinations.length === 0 ? (
                      <p className="text-center text-gray-500 py-6">
                        No hay vacunas registradas aún
                      </p>
                    ) : (
                      vaccinations.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">💉</span>
                            <div>
                              <p className="font-medium text-green-700 dark:text-green-400">
                                {v.vaccineName}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-500">
                                {v.vaccineType}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-green-700 dark:text-green-400">
                              {formatDate(v.administrationDate)}
                            </p>
                            {v.nextDoseDate && (
                              <p className="text-xs text-green-600 dark:text-green-500">
                                Próxima: {formatDate(v.nextDoseDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "desparasitacion" && (
                  <div className="space-y-3">
                    {dewormingRecords.length === 0 ? (
                      <p className="text-center text-gray-500 py-6">
                        No hay registros de desparasitación
                      </p>
                    ) : (
                      dewormingRecords.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🧪</span>
                            <div>
                              <p className="font-medium text-blue-700 dark:text-blue-400">
                                {d.productName}
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-500">
                                {d.type === "INTERNAL"
                                  ? "Interno"
                                  : d.type === "EXTERNAL"
                                  ? "Externo"
                                  : "Ambos"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                              {formatDate(d.date)}
                            </p>
                            {d.nextDate && (
                              <p className="text-xs text-blue-600 dark:text-blue-500">
                                Próxima: {formatDate(d.nextDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "condiciones" && (
                  <div className="space-y-3">
                    {chronicConditions.length === 0 ? (
                      <p className="text-center text-gray-500 py-6">
                        No hay condiciones registradas
                      </p>
                    ) : (
                      chronicConditions.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                        >
                          <div>
                            <p className="font-medium text-amber-700 dark:text-amber-400">
                              {c.name}
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-500">
                              {c.type.replace(/_/g, " ")} {c.severity && `- ${c.severity}`}
                            </p>
                            {c.notes && (
                              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                                {c.notes}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              c.isActive
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {c.isActive ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {pets.length === 0 && (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxgray p-12 text-center">
          <p className="text-gray-500">
            No tienes mascotas registradas. Contacta a la clínica para agregar una mascota.
          </p>
        </div>
      )}
    </div>
  );
}