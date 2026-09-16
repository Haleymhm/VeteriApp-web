"use client";
import React, { useState, useEffect, useCallback } from "react";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import LogoUploader from "./LogoUploader";

interface Branding {
  clinicName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  fromEmail: string;
  fromName: string;
}

export default function BrandingEditor() {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/configuracion");
      const data = await res.json();
      if (data.success) {
        setBranding(data.data.branding);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching branding:", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
     
    fetchConfig();
  }, [fetchConfig]);

  const handleChange = (field: keyof Branding, value: string) => {
    if (!branding) return;
    setBranding({ ...branding, [field]: value });
  };

  const handleLogoUpload = (url: string) => {
    if (!branding) return;
    setBranding({ ...branding, logoUrl: url });
    setSuccess("Logo actualizado");
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSave = async () => {
    if (!branding) return;
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch("/api/v1/configuracion/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName: branding.clinicName,
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          footerText: branding.footerText,
          fromEmail: branding.fromEmail,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al guardar");
        return;
      }
      setBranding(data.data);
      setSuccess("Marca actualizada exitosamente");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Cargando marca...</div>;
  if (!branding) return <div className="text-sm text-red-500">No se pudo cargar la marca.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
          Personalización de marca
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Estos elementos se usan en los PDFs descargados (historiales médicos, reportes de auditoría) y en los correos electrónicos enviados.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg dark:bg-red-900/20">{error}</div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg dark:bg-green-900/20">{success}</div>
      )}

      <LogoUploader branding={branding} onUpload={handleLogoUpload} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <div>
          <Label>Nombre de la clínica <span className="text-red-500">*</span></Label>
          <Input
            type="text"
            value={branding.clinicName}
            onChange={(e) => handleChange("clinicName", e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Email remitente <span className="text-red-500">*</span></Label>
          <Input
            type="email"
            value={branding.fromEmail}
            onChange={(e) => handleChange("fromEmail", e.target.value)}
            placeholder="noreply@ejemplo.cl"
            required
          />
        </div>
        <div>
          <Label>Color primario (PDFs/Emails)</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={branding.primaryColor}
              onChange={(e) => handleChange("primaryColor", e.target.value)}
              className="h-11 w-14 rounded border border-gray-300 dark:border-gray-600"
            />
            <Input
              type="text"
              value={branding.primaryColor}
              onChange={(e) => handleChange("primaryColor", e.target.value)}
              placeholder="#2563eb"
            />
          </div>
        </div>
        <div>
          <Label>Color secundario</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={branding.secondaryColor}
              onChange={(e) => handleChange("secondaryColor", e.target.value)}
              className="h-11 w-14 rounded border border-gray-300 dark:border-gray-600"
            />
            <Input
              type="text"
              value={branding.secondaryColor}
              onChange={(e) => handleChange("secondaryColor", e.target.value)}
              placeholder="#64748b"
            />
          </div>
        </div>
      </div>

      <div>
        <Label>Texto del pie (PDFs)</Label>
        <Input
          type="text"
          value={branding.footerText}
          onChange={(e) => handleChange("footerText", e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Vista previa tarjeta</p>
        <div
          className="rounded-lg p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
          style={{ borderTopColor: branding.primaryColor, borderTopWidth: 3 }}
        >
          <h4 style={{ color: branding.primaryColor }} className="font-bold text-lg">
            {branding.clinicName}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{branding.footerText}</p>
          <div className="mt-3 text-xs text-gray-500">
            <span>Notificaciones desde: </span>
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{branding.fromEmail}</code>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar marca"}
        </Button>
      </div>
    </div>
  );
}
