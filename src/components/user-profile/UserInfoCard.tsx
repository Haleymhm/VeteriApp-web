"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useModal } from "../../hooks/useModal";
import { useRouter } from "next/navigation";

interface ProfileUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
}

export default function UserInfoCard() {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Modal de password
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/profile");
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        setEmail(data.data.email ?? '');
        setPhone(data.data.phone ?? '');
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
     
    fetchUser();
  }, [fetchUser]);

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
          email,
          phone: phone || null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al guardar");
        return;
      }
      setUser(data.data);
      setSuccess("Datos actualizados");
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

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError("Debe incluir al menos una mayúscula y un número");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/v1/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setPasswordError(data.error || "Error al cambiar contraseña");
        return;
      }
      setPasswordSuccess("Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsPasswordOpen(false);
        setPasswordSuccess(null);
      }, 1200);
    } catch {
      setPasswordError("Error de conexión");
    } finally {
      setPasswordSaving(false);
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

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Información personal
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Nombre</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.firstName}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Apellido</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.lastName}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.email}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Teléfono</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.phone || "No registrado"}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setIsPasswordOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.5 7H11.5V4.5C11.5 3.4 10.6 2.5 9.5 2.5H8.5C7.4 2.5 6.5 3.4 6.5 4.5V7H3.5C3.2 7 3 7.2 3 7.5V14.5C3 14.8 3.2 15 3.5 15H14.5C14.8 15 15 14.8 15 14.5V7.5C15 7.2 14.8 7 14.5 7ZM8 4.5C8 4.2 8.2 4 8.5 4H9.5C9.8 4 10 4.2 10 4.5V7H8V4.5Z" fill=""/>
              </svg>
              Cambiar contraseña
            </button>
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

      {/* Modal Editar Datos */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Editar información personal
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Modifica tu email y teléfono de contacto.
            </p>
          </div>
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="custom-scrollbar overflow-y-auto px-2 pb-3">
              {error && (
                <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-lg dark:bg-red-900/20">{error}</div>
              )}
              {success && (
                <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 rounded-lg dark:bg-green-900/20">{success}</div>
              )}
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>Email <span className="text-red-500">*</span></Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <Label>Teléfono</Label>
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 ..." />
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

      {/* Modal Cambiar Contraseña */}
      <Modal isOpen={isPasswordOpen} onClose={() => { setIsPasswordOpen(false); setPasswordError(null); setPasswordSuccess(null); }} className="max-w-[500px] m-4">
        <div className="relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Cambiar contraseña
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              La nueva contraseña debe tener al menos 8 caracteres, una mayúscula y un número.
            </p>
          </div>
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleChangePassword();
            }}
          >
            <div className="px-2 pb-3">
              {passwordError && (
                <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-lg dark:bg-red-900/20">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 rounded-lg dark:bg-green-900/20">{passwordSuccess}</div>
              )}
              <div className="space-y-4">
                <div>
                  <Label>Contraseña actual <span className="text-red-500">*</span></Label>
                  <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div>
                  <Label>Nueva contraseña <span className="text-red-500">*</span></Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div>
                  <Label>Confirmar nueva contraseña <span className="text-red-500">*</span></Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={() => setIsPasswordOpen(false)} disabled={passwordSaving}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={passwordSaving}>{passwordSaving ? "Cambiando..." : "Cambiar contraseña"}</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
