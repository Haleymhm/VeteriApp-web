import { prisma } from '@/lib/prisma';

export interface ClinicBranding {
  clinicName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  fromEmail: string;
  fromName: string;
}

export const DEFAULT_BRANDING: ClinicBranding = {
  clinicName: 'VeteriApp',
  logoUrl: null,
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  footerText: 'VeteriApp - Gestión Integral Veterinaria',
  fromEmail: 'noreply@vetriapp.cl',
  fromName: 'VeteriApp',
};

export async function getBranding(): Promise<ClinicBranding> {
  try {
    const setting = await prisma.clinicSetting.findUnique({
      where: { key: 'branding' },
    });
    if (setting && setting.value && typeof setting.value === 'object') {
      return { ...DEFAULT_BRANDING, ...(setting.value as Partial<ClinicBranding>) };
    }
  } catch (err) {
    console.warn('[getBranding] Falling back to defaults:', err);
  }
  return DEFAULT_BRANDING;
}

export async function saveBranding(branding: ClinicBranding, updatedById?: string) {
  await prisma.clinicSetting.upsert({
    where: { key: 'branding' },
    update: {
      value: branding as unknown as object,
      updatedById: updatedById ?? null,
    },
    create: {
      key: 'branding',
      value: branding as unknown as object,
      updatedById: updatedById ?? null,
    },
  });
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}
