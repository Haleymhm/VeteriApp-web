"use client";

import { useEffect, useState } from "react";
import { generateMedicalHistoryPDF } from "@/lib/medical-history-pdf";

type DewormingType = "INTERNAL" | "EXTERNAL" | "BOTH";

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  owner: { id: number; firstName: string; lastName: string; email: string };
}

interface VitalSigns {
  id: number;
  weight: number | null;
  temperature: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  capillaryRefillTime: string | null;
  dehydrationPercentage: number | null;
  mucousMembranes: string | null;
}

interface ExamAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  description: string | null;
  createdAt: string;
}

interface MedicalRecord {
  id: number;
  date: string;
  title: string;
  diagnosis: string | null;
  treatment: string | null;
  publicNotes: string;
  privateNotes: string | null;
  petId: number;
  vetId: number;
  pet: { id: number; name: string; species: string };
  vet: { id: number; firstName: string; lastName: string };
  vitals: VitalSigns | null;
  exams: ExamAttachment[];
  createdAt: string;
}

interface Vaccination {
  id: number;
  vaccineName: string;
  vaccineType: string;
  administrationDate: string;
  nextDoseDate: string | null;
  lotNumber: string | null;
  manufacturer: string | null;
  veterinarian: string | null;
  petId: number;
  createdAt: string;
}

interface Deworming {
  id: number;
  productName: string;
  type: DewormingType;
  dosage: string | null;
  date: string;
  nextDate: string | null;
  petId: number;
  createdAt: string;
}

interface SurgicalHistory {
  id: number;
  procedure: string;
  date: string | null;
  complications: string | null;
  notes: string | null;
  outcomes: string | null;
  petId: number;
  createdAt: string;
}

interface ChronicCondition {
  id: number;
  name: string;
  type: string;
  severity: string | null;
  diagnosisDate: string | null;
  notes: string | null;
  isActive: boolean;
  petId: number;
  createdAt: string;
}

type TabType = "resumen" | "vacunas" | "desparasitacion" | "quirurgicos" | "consultas" | "alergias";

const dewormingTypeLabels: Record<DewormingType, string> = {
  INTERNAL: "Interno",
  EXTERNAL: "Externo",
  BOTH: "Ambos",
};

export default function HistorialMedicoPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("resumen");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<TabType | null>(null);

  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [dewormingRecords, setDewormingRecords] = useState<Deworming[]>([]);
  const [surgicalHistory, setSurgicalHistory] = useState<SurgicalHistory[]>([]);
  const [chronicConditions, setChronicConditions] = useState<ChronicCondition[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  const [formData, setFormData] = useState<Record<string, string>>({});

  const fetchPets = async () => {
    try {
      const res = await fetch("/api/v1/pets");
      const data = await res.json();
      if (data.success) {
        setPets(data.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
    }
  };

  const fetchAllMedicalData = async () => {
    if (!selectedPetId) return;
    await Promise.all([
      fetchVaccinations(),
      fetchDeworming(),
      fetchSurgicalHistory(),
      fetchChronicConditions(),
      fetchMedicalRecords(),
    ]);
  };

  const fetchVaccinations = async () => {
    try {
      const res = await fetch(`/api/v1/pets/${selectedPetId}/vaccinations`);
      const data = await res.json();
      if (data.success) setVaccinations(data.data || []);
    } catch (error) {
      console.error("Error fetching vaccinations:", error);
    }
  };

  const fetchDeworming = async () => {
    try {
      const res = await fetch(`/api/v1/pets/${selectedPetId}/deworming`);
      const data = await res.json();
      if (data.success) setDewormingRecords(data.data || []);
    } catch (error) {
      console.error("Error fetching deworming:", error);
    }
  };

  const fetchSurgicalHistory = async () => {
    try {
      const res = await fetch(`/api/v1/pets/${selectedPetId}/surgical-history`);
      const data = await res.json();
      if (data.success) setSurgicalHistory(data.data || []);
    } catch (error) {
      console.error("Error fetching surgical history:", error);
    }
  };

  const fetchChronicConditions = async () => {
    try {
      const res = await fetch(`/api/v1/pets/${selectedPetId}/chronic-conditions`);
      const data = await res.json();
      if (data.success) setChronicConditions(data.data || []);
    } catch (error) {
      console.error("Error fetching chronic conditions:", error);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      const res = await fetch(`/api/v1/medical-records?petId=${selectedPetId}`);
      const data = await res.json();
      if (data.success) setMedicalRecords(data.data || []);
    } catch (error) {
      console.error("Error fetching medical records:", error);
    }
  };

  const openModal = (type: TabType) => {
    setModalType(type);
    setFormData({});
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId || !modalType) return;

    let url = "";
    let payload: Record<string, unknown> = {};

    switch (modalType) {
      case "vacunas":
        url = `/api/v1/pets/${selectedPetId}/vaccinations`;
        payload = {
          vaccineName: formData.vaccineName,
          vaccineType: formData.vaccineType,
          administrationDate: formData.administrationDate || undefined,
          nextDoseDate: formData.nextDoseDate || null,
          lotNumber: formData.lotNumber || null,
          manufacturer: formData.manufacturer || null,
          veterinarian: formData.veterinarian || null,
        };
        break;
      case "desparasitacion":
        url = `/api/v1/pets/${selectedPetId}/deworming`;
        payload = {
          productName: formData.productName,
          type: formData.type,
          dosage: formData.dosage || null,
          date: formData.date || undefined,
          nextDate: formData.nextDate || null,
        };
        break;
      case "quirurgicos":
        url = `/api/v1/pets/${selectedPetId}/surgical-history`;
        payload = {
          procedure: formData.procedure,
          date: formData.date || null,
          complications: formData.complications || null,
          notes: formData.notes || null,
          outcomes: formData.outcomes || null,
        };
        break;
      case "alergias":
        url = `/api/v1/pets/${selectedPetId}/chronic-conditions`;
        payload = {
          name: formData.name,
          type: formData.type,
          severity: formData.severity || null,
          diagnosisDate: formData.diagnosisDate || null,
          notes: formData.notes || null,
          isActive: true,
        };
        break;
      case "consultas":
        url = "/api/v1/medical-records";
        payload = {
          petId: selectedPetId,
          date: formData.date || undefined,
          title: formData.title,
          diagnosis: formData.diagnosis || null,
          treatment: formData.treatment || null,
          publicNotes: formData.publicNotes,
          privateNotes: formData.privateNotes || null,
          vitals: {
            weight: formData.weight ? Number(formData.weight) : null,
            temperature: formData.temperature ? Number(formData.temperature) : null,
            heartRate: formData.heartRate ? Number(formData.heartRate) : null,
            respiratoryRate: formData.respiratoryRate ? Number(formData.respiratoryRate) : null,
          },
        };
        break;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchAllMedicalData();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-CL");
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchPets();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchAllMedicalData();
  }, [selectedPetId]);

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
        owner: selectedPet.owner,
      },
      vaccinations: vaccinations.map((v) => ({
        vaccineName: v.vaccineName,
        vaccineType: v.vaccineType,
        administrationDate: v.administrationDate,
        nextDoseDate: v.nextDoseDate,
        lotNumber: v.lotNumber,
        manufacturer: v.manufacturer,
      })),
      deworming: dewormingRecords.map((d) => ({
        productName: d.productName,
        type: d.type,
        date: d.date,
        nextDate: d.nextDate,
        dosage: d.dosage,
      })),
      surgicalHistory: surgicalHistory.map((s) => ({
        procedure: s.procedure,
        date: s.date,
        complications: s.complications,
        notes: s.notes,
      })),
      chronicConditions: chronicConditions.map((c) => ({
        name: c.name,
        type: c.type,
        severity: c.severity,
        diagnosisDate: c.diagnosisDate,
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

  const tabs: { key: TabType; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "vacunas", label: "Vacunas" },
    { key: "desparasitacion", label: "Desparasitación" },
    { key: "quirurgicos", label: "Quirúrgicos" },
    { key: "consultas", label: "Consultas" },
    { key: "alergias", label: "Alergias/Patologías" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Historial Médico
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedPetId || ""}
            onChange={(e) => setSelectedPetId(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark min-w-[200px] dark:text-white/90"
          >
            <option value="">Seleccionar mascota...</option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} ({pet.species}) - {pet.owner.firstName} {pet.owner.lastName}
              </option>
            ))}
          </select>
          {selectedPetId && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar PDF
            </button>
          )}
        </div>
      </div>

      {selectedPetId && (
        <>
          <div className="mb-6 p-4 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxgray">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {selectedPet?.species.toLowerCase().includes("perro")
                  ? "🐕"
                  : selectedPet?.species.toLowerCase().includes("gato")
                    ? "🐈"
                    : "🐾"}
              </span>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white/90">
                  {selectedPet?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedPet?.species} {selectedPet?.breed && `- ${selectedPet.breed}`} |{" "}
                  Dueño: {selectedPet?.owner.firstName} {selectedPet?.owner.lastName}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 border-b border-stroke dark:border-strokedark">
            <nav className="flex gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
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
            <div className="p-4 flex justify-end">
              {activeTab !== "resumen" && (
                <button
                  onClick={() => openModal(activeTab)}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
                >
                  + Agregar{" "}
                  {activeTab === "vacunas"
                    ? "Vacuna"
                    : activeTab === "desparasitacion"
                      ? "Desparasitación"
                      : activeTab === "quirurgicos"
                        ? "Intervención"
                        : activeTab === "consultas"
                          ? "Consulta"
                          : "Condición"}
                </button>
              )}
            </div>

            <div className="p-4">
              {activeTab === "resumen" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <h4 className="text-sm font-medium text-green-700 dark:text-green-400">Vacunas</h4>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-300">
                      {vaccinations.length}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {vaccinations.filter((v) => {
                        if (!v.nextDoseDate) return false;
                        return new Date(v.nextDoseDate) > new Date();
                      }).length}{" "}
                      próximas
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      Desparasitaciones
                    </h4>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                      {dewormingRecords.length}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Últimas: {dewormingRecords[0] ? formatDate(dewormingRecords[0].date) : "-"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <h4 className="text-sm font-medium text-purple-700 dark:text-purple-400">
                      Quirúrgicos
                    </h4>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                      {surgicalHistory.length}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Procedimientos registrados
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Condiciones Crónicas
                    </h4>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">
                      {chronicConditions.length}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {chronicConditions.filter((c) => c.isActive).length} activas
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Consultas</h4>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-300">
                      {medicalRecords.length}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Registros médicos
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "vacunas" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stroke dark:border-strokedark">
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Vacuna</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Tipo</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Fecha</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Próxima Dosis</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Lote</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaccinations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                            No hay vacunas registradas
                          </td>
                        </tr>
                      ) : (
                        vaccinations.map((v) => (
                          <tr key={v.id} className="border-b border-stroke dark:border-strokedark">
                            <td className="px-3 py-2 text-sm font-medium dark:text-white">{v.vaccineName}</td>
                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-white">{v.vaccineType}</td>
                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-white">{formatDate(v.administrationDate)}</td>
                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-white">{formatDate(v.nextDoseDate)}</td>
                            <td className="px-3 py-2 text-sm font-mono text-gray-500 dark:text-white">{v.lotNumber || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "desparasitacion" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stroke dark:border-strokedark">
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Producto</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Tipo</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Fecha</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Próxima</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Dosis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dewormingRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                            No hay registros de desparasitación
                          </td>
                        </tr>
                      ) : (
                        dewormingRecords.map((d) => (
                          <tr key={d.id} className="border-b border-stroke dark:border-strokedark">
                            <td className="px-3 py-2 text-sm font-medium dark:text-white">{d.productName}</td>
                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-white">
                              {dewormingTypeLabels[d.type]}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-white">{formatDate(d.date)}</td>
                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-white">{formatDate(d.nextDate)}</td>
                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-white">{d.dosage || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "quirurgicos" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stroke dark:border-strokedark">
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Procedimiento</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Fecha</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Complicaciones</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surgicalHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                            No hay antecedentes quirúrgicos
                          </td>
                        </tr>
                      ) : (
                        surgicalHistory.map((s) => (
                          <tr key={s.id} className="border-b border-stroke dark:border-strokedark">
                            <td className="px-3 py-2 text-sm font-medium dark:text-white">{s.procedure}</td>
                            <td className="px-3 py-2 text-sm text-gray-500  dark:text-white">{formatDate(s.date)}</td>
                            <td className="px-3 py-2 text-sm text-gray-500  dark:text-white">{s.complications || "-"}</td>
                            <td className="px-3 py-2 text-sm text-gray-500  dark:text-white">{s.notes || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "consultas" && (
                <div className="space-y-4">
                  {medicalRecords.length === 0 ? (
                    <p className="text-center text-gray-500 py-6">No hay consultas registradas</p>
                  ) : (
                    medicalRecords.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-lg border border-stroke dark:border-strokedark"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-white/90">{m.title}</h4>
                            <p className="text-sm text-gray-500">
                              {formatDate(m.date)} | Dr. {m.vet.firstName} {m.vet.lastName}
                            </p>
                          </div>
                        </div>
                        {m.vitals && (
                          <div className="grid grid-cols-4 gap-2 mb-3 p-2 bg-gray-50 dark:bg-white/5 rounded">
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Peso</p>
                              <p className="text-sm font-medium dark:text-white/90">{m.vitals.weight || "-"} kg</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Temp</p>
                              <p className="text-sm font-medium dark:text-white/90">{m.vitals.temperature || "-"} °C</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">FC</p>
                              <p className="text-sm font-medium dark:text-white/90">{m.vitals.heartRate || "-"} lpm</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">FR</p>
                              <p className="text-sm font-medium dark:text-white/90">{m.vitals.respiratoryRate || "-"} rpm</p>
                            </div>
                          </div>
                        )}
                        {m.diagnosis && (
                          <p className="text-sm mb-1">
                            <span className="font-medium text-gray-500 ">Diagnóstico:</span> <span className="text-gray-600 dark:text-white">{m.diagnosis}</span>
                          </p>
                        )}
                        {m.treatment && (
                          <p className="text-sm mb-1">
                            <span className="font-medium text-gray-500 ">Tratamiento:</span> <span className="text-gray-600 dark:text-white">{m.treatment}</span>
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{m.publicNotes}</p>
                        {m.privateNotes && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-2 italic">
                            <span className="font-medium">Nota Privada:</span> {m.privateNotes}
                          </p>
                        )}
                        {m.exams && m.exams.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-500">Exámenes:</p>
                            <div className="flex gap-2 mt-1">
                              {m.exams.map((e) => (
                                <span
                                  key={e.id}
                                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-white/10 rounded"
                                >
                                  {e.fileName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "alergias" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stroke dark:border-strokedark">
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Nombre</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Tipo</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Severidad</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Estado</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chronicConditions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                            No hay condiciones crónicas registradas
                          </td>
                        </tr>
                      ) : (
                        chronicConditions.map((c) => (
                          <tr key={c.id} className="border-b border-stroke dark:border-strokedark">
                            <td className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-white/90">{c.name}</td>
                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-white/90">{c.type}</td>
                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-white/90">{c.severity || "-"}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-1 text-xs rounded ${c.isActive
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                                  }`}
                              >
                                {c.isActive ? "Activa" : "Inactiva"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-500">{c.notes || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!selectedPetId && (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxgray p-12 text-center">
          <p className="text-gray-500">Seleccione una mascota para ver su historial médico</p>
        </div>
      )}

      {showModal && modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg p-6 bg-white rounded-lg dark:bg-boxdark max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              {modalType === "vacunas" && "Registrar Vacuna"}
              {modalType === "desparasitacion" && "Registrar Desparasitación"}
              {modalType === "quirurgicos" && "Registrar Intervención Quirúrgica"}
              {modalType === "consultas" && "Registrar Consulta"}
              {modalType === "alergias" && "Registrar Condición Crónica / Alergia"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modalType === "vacunas" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Nombre de Vacuna *
                      </label>
                      <select
                        value={formData.vaccineName || ""}
                        onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                      >
                        <option value="">Seleccionar</option>
                        <option value="Óctuple">Óctuple (Perros)</option>
                        <option value="Séxtuple">Séxtuple (Perros)</option>
                        <option value="Triple Felina">Triple Felina (Gatos)</option>
                        <option value="Leucemia Felina">Leucemia Felina (Gatos)</option>
                        <option value="Antirrábica">Antirrábica</option>
                        <option value="Otra">Otra</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Tipo *
                      </label>
                      <input
                        type="text"
                        value={formData.vaccineType || ""}
                        onChange={(e) => setFormData({ ...formData, vaccineType: e.target.value })}
                        required
                        placeholder="Ej: Viral, Bacteriana"
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Fecha de Administración
                      </label>
                      <input
                        type="date"
                        value={formData.administrationDate || ""}
                        onChange={(e) => setFormData({ ...formData, administrationDate: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Próxima Dosis
                      </label>
                      <input
                        type="date"
                        value={formData.nextDoseDate || ""}
                        onChange={(e) => setFormData({ ...formData, nextDoseDate: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90  "
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Número de Lote
                      </label>
                      <input
                        type="text"
                        value={formData.lotNumber || ""}
                        onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Fabricante
                      </label>
                      <input
                        type="text"
                        value={formData.manufacturer || ""}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                      />
                    </div>
                  </div>
                </>
              )}

              {modalType === "desparasitacion" && (
                <>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      value={formData.productName || ""}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      required
                      placeholder="Ej: Drontal, Frontline"
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Tipo *
                      </label>
                      <select
                        value={formData.type || ""}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90"
                      >
                        <option value="">Seleccionar</option>
                        <option value="INTERNAL">Interno</option>
                        <option value="EXTERNAL">Externo</option>
                        <option value="BOTH">Ambos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={formData.date || ""}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 "
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Próxima Desparasitación
                      </label>
                      <input
                        type="date"
                        value={formData.nextDate || ""}
                        onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 "
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Dosis
                      </label>
                      <input
                        type="text"
                        value={formData.dosage || ""}
                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                        placeholder="Ej: 1ml, 1 comprimido"
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 "
                      />
                    </div>
                  </div>
                </>
              )}

              {modalType === "quirurgicos" && (
                <>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Procedimiento *
                    </label>
                    <input
                      type="text"
                      value={formData.procedure || ""}
                      onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                      required
                      placeholder="Ej: Esterilización, Extracción dental"
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 "
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={formData.date || ""}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 "
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Resultado
                      </label>
                      <input
                        type="text"
                        value={formData.outcomes || ""}
                        onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
                        placeholder="Ej: Exitoso"
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 "
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Complicaciones
                    </label>
                    <textarea
                      value={formData.complications || ""}
                      onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Notas
                    </label>
                    <textarea
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 resize-none"
                    />
                  </div>
                </>
              )}

              {modalType === "consultas" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={formData.date || ""}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 "
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Motivo/Título *
                      </label>
                      <input
                        type="text"
                        value={formData.title || ""}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="Ej: Control, Vacunación"
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 "
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weight || ""}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 "
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Temp (°C)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.temperature || ""}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 "
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        FC (lpm)
                      </label>
                      <input
                        type="number"
                        value={formData.heartRate || ""}
                        onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 "
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        FR (rpm)
                      </label>
                      <input
                        type="number"
                        value={formData.respiratoryRate || ""}
                        onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 "
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Diagnóstico
                    </label>
                    <textarea
                      value={formData.diagnosis || ""}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Tratamiento
                    </label>
                    <textarea
                      value={formData.treatment || ""}
                      onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Notas Públicas *
                    </label>
                    <textarea
                      value={formData.publicNotes || ""}
                      onChange={(e) => setFormData({ ...formData, publicNotes: e.target.value })}
                      required
                      rows={3}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90  resize-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Notas Privadas (solo vets)
                    </label>
                    <textarea
                      value={formData.privateNotes || ""}
                      onChange={(e) => setFormData({ ...formData, privateNotes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90  resize-none"
                    />
                  </div>
                </>
              )}

              {modalType === "alergias" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Ej: Alergia al pollo, Diabetes"
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90  "
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Tipo *
                      </label>
                      <select
                        value={formData.type || ""}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90  "
                      >
                        <option value="">Seleccionar</option>
                        <option value="ALERGIA_ALIMENTARIA">Alergia Alimentaria</option>
                        <option value="ALERGIA_AMBIENTAL">Alergia Ambiental</option>
                        <option value="ALERGIA_FARMACOLOGICA">Alergia Farmacológica</option>
                        <option value="PATOLOGIA_CRONICA">Patología Crónica</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Severidad
                      </label>
                      <select
                        value={formData.severity || ""}
                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90  "
                      >
                        <option value="">Seleccionar</option>
                        <option value="LEVE">Leve</option>
                        <option value="MODERADA">Moderada</option>
                        <option value="SEVERA">Severa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                        Fecha de Diagnóstico
                      </label>
                      <input
                        type="date"
                        value={formData.diagnosisDate || ""}
                        onChange={(e) => setFormData({ ...formData, diagnosisDate: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90  "
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Notas
                    </label>
                    <textarea
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Detalles adicionales sobre la condición..."
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark dark:text-white/90 resize-none"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-400 dark:border-strokedark dark:hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}