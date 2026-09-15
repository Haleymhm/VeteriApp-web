'use client';

import React from 'react';
import type {
  DashboardMetricsDTO,
  DashboardRange,
} from '@/types';
import KpiCard from './KpiCard';
import AppointmentsByStatusChart from './AppointmentsByStatusChart';
import SpeciesDistributionChart from './SpeciesDistributionChart';
import UpcomingAppointmentsList from './UpcomingAppointmentsList';
import TopVetsChart from './TopVetsChart';
import DashboardRangeSelector from './DashboardRangeSelector';
import QuickActionsBar from './QuickActionsBar';

interface Props {
  metrics: DashboardMetricsDTO;
  initialRange: DashboardRange;
}

function formatPercent(n: number): string {
  if (!isFinite(n)) return '0%';
  return `${n > 0 ? '+' : ''}${Math.round(n)}%`;
}

export default function DashboardPanel({ metrics, initialRange }: Props) {
  const revenue = metrics.revenue;
  const revenueTrend: 'up' | 'down' | 'flat' =
    revenue.percentChange > 0 ? 'up' : revenue.percentChange < 0 ? 'down' : 'flat';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Centro de Control Clínico
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Resumen operativo y atenciones veterinarias de {metrics.rangeLabel.toLowerCase()}
          </p>
        </div>
        <DashboardRangeSelector active={initialRange} />
      </div>

      <QuickActionsBar />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <KpiCard
          label="Citas de hoy"
          value={metrics.today.total}
          hint={`${metrics.today.byStatus.PENDING} pendientes · ${metrics.today.byStatus.CONFIRMED} confirmadas`}
          accent="indigo"
        />
        <KpiCard
          label="Mascotas activas"
          value={metrics.pets.active}
          hint={`${metrics.pets.newThisMonth} nuevas este mes`}
          accent="emerald"
        />
        <KpiCard
          label="Ingresos del mes"
          value={`$${(revenue.thisMonth ?? 0).toLocaleString('es-CL')}`}
          hint="Pendiente de modelo de facturación"
          trend={revenueTrend}
          trendLabel={formatPercent(revenue.percentChange)}
          accent="amber"
        />
        <KpiCard
          label="Próxima cita"
          value={
            metrics.upcomingAppointments.length > 0
              ? new Intl.DateTimeFormat('es-CL', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: 'short',
                }).format(new Date(metrics.upcomingAppointments[0].date))
              : '—'
          }
          hint={
            metrics.upcomingAppointments.length > 0
              ? `${metrics.upcomingAppointments[0].petName} · ${metrics.upcomingAppointments[0].ownerName}`
              : 'Sin citas próximas'
          }
          accent="rose"
        />
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-7">
          <AppointmentsByStatusChart byStatus={metrics.appointmentsByStatus} />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <SpeciesDistributionChart distribution={metrics.speciesDistribution} />
        </div>
        <div className="col-span-12 xl:col-span-7">
          <UpcomingAppointmentsList appointments={metrics.upcomingAppointments} />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <TopVetsChart topVets={metrics.topVets} />
        </div>
      </div>
    </div>
  );
}
