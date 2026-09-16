"use client";

import { useEffect, useState } from "react";
import SpeciesBadge from "@/components/common/SpeciesBadge";
import Sheet from "@/components/ui/drawer/Sheet";

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

type Sex = "MALE" | "FEMALE";
type ReproductiveStatus = "FERTILE" | "STERILIZED" | "CASTRATED";

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weight: number | null;
  sex: Sex | null;
  reproductiveStatus: ReproductiveStatus | null;
  specialCharacteristics: string | null;
  microchipNumber: string | null;
  owner: Owner;
  createdAt: string;
}

interface ApiResponse {
  data: Pet[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface ClientsApiResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MascotasPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    birthDate: "",
    weight: "",
    sex: "" as Sex | "",
    reproductiveStatus: "" as ReproductiveStatus | "",
    specialCharacteristics: "",
    microchipNumber: "",
    ownerId: "",
  });

  useEffect(() => {
    fetchPets();
    fetchClientsForSelect();
  }, [search]);

  const fetchPets = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/pets?${params}`);
      const data = await res.json();
      if (data.success) {
        const response = data.data as ApiResponse;
        setPets(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsForSelect = async () => {
    try {
      const res = await fetch("/api/v1/clients");
      const data = await res.json();
      if (data.success) {
        const response = data.data as ClientsApiResponse;
        setClients(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      species: form.species,
      breed: form.breed || null,
      birthDate: form.birthDate || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      sex: form.sex || null,
      reproductiveStatus: form.reproductiveStatus || null,
      specialCharacteristics: form.specialCharacteristics || null,
      microchipNumber: form.microchipNumber || null,
      ownerId: form.ownerId,
    };

    const url = editingPet ? `/api/v1/pets/${editingPet.id}` : "/api/v1/pets";
    const method = editingPet ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        fetchPets();
        resetForm();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error saving pet:", error);
    }
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      birthDate: pet.birthDate ? pet.birthDate.split("T")[0] : "",
      weight: pet.weight ? pet.weight.toString() : "",
      sex: pet.sex || "",
      reproductiveStatus: pet.reproductiveStatus || "",
      specialCharacteristics: pet.specialCharacteristics || "",
      microchipNumber: pet.microchipNumber || "",
      ownerId: pet.owner.id.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta mascota?")) return;

    try {
      const res = await fetch(`/api/v1/pets/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchPets();
      }
    } catch (error) {
      console.error("Error deleting pet:", error);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingPet(null);
    setForm({
      name: "",
      species: "",
      breed: "",
      birthDate: "",
      weight: "",
      sex: "",
      reproductiveStatus: "",
      specialCharacteristics: "",
      microchipNumber: "",
      ownerId: "",
    });
  };

  const getSexLabel = (sex: Sex | null) => {
    if (!sex) return "-";
    return sex === "MALE" ? "Macho" : "Hembra";
  };

  const getReproductiveStatusLabel = (status: ReproductiveStatus | null) => {
    if (!status) return "-";
    const labels: Record<ReproductiveStatus, string> = {
      FERTILE: "Fértil",
      STERILIZED: "Esterilizado",
      CASTRATED: "Castrado",
    };
    return labels[status];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Mascotas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Registro clínico de pacientes, microchips y propietarios.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-theme-xs cursor-pointer"
        >
          + Nueva Mascota
        </button>
      </div>

      <div>
        <input
          type="text"
          placeholder="Buscar por nombre o microchip..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-theme-xs"
        />
      </div>

      <div className="rounded-2xl border border-gray-200/90 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500 animate-pulse">Cargando pacientes...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                    Mascota
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                    Especie / Raza
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                    Sexo
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                    Estado Reprod.
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                    Microchip
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                    Propietario
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                    Peso
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      No hay mascotas registradas
                    </td>
                  </tr>
                ) : (
                  pets.map((pet) => (
                    <tr
                      key={pet.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <SpeciesBadge species={pet.species} variant="icon" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {pet.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        <SpeciesBadge species={pet.species} variant="chip" showBreed={pet.breed} />
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {getSexLabel(pet.sex)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {getReproductiveStatusLabel(pet.reproductiveStatus)}
                      </td>
                      <td className="px-5 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                        {pet.microchipNumber || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {pet.owner.firstName} {pet.owner.lastName}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {pet.weight ? `${pet.weight} kg` : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleEdit(pet)}
                          className="mr-3 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(pet.id)}
                          className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet
        isOpen={showModal}
        onClose={resetForm}
        title={editingPet ? "Editar Mascota" : "Registrar Nueva Mascota"}
        description="Ingresa los antecedentes biomédicos y el propietario asignado."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                Nombre *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                Microchip
              </label>
              <input
                type="text"
                value={form.microchipNumber}
                onChange={(e) => setForm({ ...form, microchipNumber: e.target.value })}
                placeholder="Ej: ABC123456789"
                className="w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                Especie *
              </label>
              <select
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">Seleccionar</option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
                <option value="Ave">Ave</option>
                <option value="Hamster">Hamster</option>
                <option value="Conejo">Conejo</option>
                <option value="Pez">Pez</option>
                <option value="Reptil">Reptil</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                Raza
              </label>
              <input
                type="text"
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                Sexo
              </label>
              <select
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value as Sex | "" })}
                className="w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">Seleccionar</option>
                <option value="MALE">Macho</option>
                <option value="FEMALE">Hembra</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                Estado Reproductivo
              </label>
              <select
                value={form.reproductiveStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    reproductiveStatus: e.target.value as ReproductiveStatus | "",
                  })
                }
                className="w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">Seleccionar</option>
                <option value="FERTILE">Fértil</option>
                <option value="STERILIZED">Esterilizado/a</option>
                <option value="CASTRATED">Castrado/a</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="Ej: 12.5"
                className="w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
              Características Especiales / Alergias
            </label>
            <textarea
              value={form.specialCharacteristics}
              onChange={(e) => setForm({ ...form, specialCharacteristics: e.target.value })}
              rows={3}
              placeholder="Ej: Alergias alimentarias, reactivo con otros perros..."
              className="w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
              Propietario Asignado *
            </label>
            <select
              value={form.ownerId}
              onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
              required
              className="w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">Seleccionar cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName} ({client.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-theme-xs"
            >
              {editingPet ? "Actualizar Mascota" : "Guardar Mascota"}
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}