"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useModal } from "../../hooks/useModal";
import { useRouter } from "next/navigation";

interface Region {
  id: string;
  name: string;
  code: string;
}

interface Comuna {
  id: string;
  name: string;
  code: string;
  regionId: string;
}

interface ProfileUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  address: string | null;
  regionId: string | null;
  comunaId: string | null;
  region?: { id: string; name: string; code: string } | null;
  comuna?: { id: string; name: string; code: string; regionId: string } | null;
}

export default function UserAddressCard() {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [regions, setRegions] = useState<Region[]>([]);
  const [comunasAll, setComunasAll] = useState<Comuna[]>([]);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [regionId, setRegionId] = useState('');
  const [comunaId, setComunaId] = useState('');

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/profile");
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        setPhone(data.data.phone ?? '');
        setAddress(data.data.address ?? '');
        setRegionId(data.data.regionId ?? '');
        setComunaId(data.data.comunaId ?? '');
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRegionsAndComunas = useCallback(async () => {
    try {
      const [regionsRes, comunasRes] = await Promise.all([
        fetch("/api/v1/regions").then(r => r.json()),
        fetch("/api/v1/comunas").then(r => r.json()),
      ]);
      if (regionsRes.success) setRegions(regionsRes.data);
      if (comunasRes.success) setComunasAll(comunasRes.data);
    } catch (err) {
      console.error("Error fetching regions/comunas:", err);
    }
  }, []);

  useEffect(() => {
     
    fetchUser();
    fetchRegionsAndComunas();
  }, [fetchUser, fetchRegionsAndComunas]);

  const filteredComunas = useMemo(
    () => (regionId ? comunasAll.filter(c => c.regionId === regionId) : []),
    [regionId, comunasAll]
  );

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch("/api/v1/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email,
          phone: phone || null,
          address: address || null,
          regionId: regionId || null,
          comunaId: comunaId || null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al guardar");
        return;
      }
      setUser(data.data);
      setSuccess("Dirección actualizada");
      router.refresh();
      setTimeout(() => {
        closeModal();
        setSuccess(null);
      }, 800);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="text-sm text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!user) return null;

  const regionName = user.region?.name || '—';
  const comunaName = user.comuna?.name || '—';

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Dirección y contacto
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Región</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{regionName}</p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Comuna</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{comunaName}</p>
              </div>
              <div className="col-span-2">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Dirección</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.address || "No registrada"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Teléfono</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.phone || "No registrado"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" fill=""/>
            </svg>
            Editar
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
        <div className="relative w-full max-w-[600px] overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11 p-4">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Editar dirección
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Actualiza tu dirección, región, comuna y teléfono.
            </p>
          </div>
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="px-2 overflow-y-auto custom-scrollbar">
              {error && (
                <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-lg dark:bg-red-900/20">{error}</div>
              )}
              {success && (
                <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 rounded-lg dark:bg-green-900/20">{success}</div>
              )}
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Región</Label>
                  <select
                    value={regionId}
                    onChange={(e) => { setRegionId(e.target.value); setComunaId(''); }}
                    className="w-full px-4 py-3 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 dark:text-white/90"
                  >
                    <option value="">Seleccionar región</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Comuna</Label>
                  <select
                    value={comunaId}
                    onChange={(e) => setComunaId(e.target.value)}
                    disabled={!regionId}
                    className="w-full px-4 py-3 text-sm border rounded-lg bg-white dark:bg-boxdark border-gray-300 dark:border-strokedark focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 dark:text-white/90 disabled:opacity-50"
                  >
                    <option value="">Seleccionar comuna</option>
                    {filteredComunas.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <Label>Dirección</Label>
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, número, departamento"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Teléfono</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 ..."
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={closeModal} disabled={saving}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
