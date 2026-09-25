import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import DashboardPanel from '@/components/dashboard/DashboardPanel';
import { computeDashboardMetrics } from '@/services/dashboard-metrics';
import type { DashboardMetricsDTO, DashboardRange } from '@/types';
import type { Role } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Panel | VeteriApp Gestión Integral Veterinaria',
  description: 'Resumen operativo de citas, mascotas y distribución por especie.',
};

const ALLOWED_RANGES: DashboardRange[] = ['month', 'prev', 'quarter', 'year'];

function parseRange(raw: string | string[] | undefined): DashboardRange {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && (ALLOWED_RANGES as string[]).includes(value)) {
    return value as DashboardRange;
  }
  return 'month';
}

interface PageProps {
  searchParams: Promise<{ range?: string | string[] }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { range } = await searchParams;
  const selectedRange = parseRange(range);

  const hdrs = await headers();
  const userId = hdrs.get('x-user-id');
  const role = hdrs.get('x-user-role') as Role | null;
  const email = hdrs.get('x-user-email');
  const firstName = hdrs.get('x-user-firstname') ?? '';
  const lastName = hdrs.get('x-user-lastname') ?? '';

  if (!userId || !role) {
    void cookies();
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          No se pudo recuperar la sesión actual. Vuelve a iniciar sesión.
        </p>
      </div>
    );
  }

  if (role === 'CLIENT') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Esta vista está reservada al personal de la veterinaria.
        </p>
      </div>
    );
  }

  const user = {
    userId,
    role,
    firstName,
    lastName,
    email: email ?? '',
  };

  let raw: Awaited<ReturnType<typeof computeDashboardMetrics>>;
  try {
    raw = await computeDashboardMetrics(prisma, user, selectedRange);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Dashboard render error:', err);
    }
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/40 dark:bg-rose-900/20">
        <p className="text-sm text-rose-700 dark:text-rose-300">
          No fue posible cargar las métricas del panel. Inténtalo nuevamente en unos minutos.
        </p>
      </div>
    );
  }

  const metrics = raw as DashboardMetricsDTO;

  return <DashboardPanel metrics={metrics} initialRange={selectedRange} />;
}
