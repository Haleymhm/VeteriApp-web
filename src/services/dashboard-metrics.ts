import type { PrismaClient } from '@prisma/client';
import type { AppointmentStatus, Role } from '@prisma/client';

export type DashboardRange = 'month' | 'prev' | 'quarter' | 'year';

export interface DashboardUser {
  userId: string;
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
}

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export const ALL_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

export function getRangeDates(range: DashboardRange, now: Date = new Date()): DateRange {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (range) {
    case 'month': {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      m.setHours(0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      e.setHours(23, 59, 59, 999);
      return { start: m, end: e, label: 'Mes actual' };
    }
    case 'prev': {
      const m = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      m.setHours(0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      e.setHours(23, 59, 59, 999);
      return { start: m, end: e, label: 'Mes anterior' };
    }
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      const m = new Date(now.getFullYear(), q * 3, 1);
      m.setHours(0, 0, 0, 0);
      const e = new Date(now.getFullYear(), q * 3 + 3, 0);
      e.setHours(23, 59, 59, 999);
      return { start: m, end: e, label: 'Trimestre actual' };
    }
    case 'year': {
      const m = new Date(now.getFullYear(), 0, 1);
      m.setHours(0, 0, 0, 0);
      const e = new Date(now.getFullYear(), 11, 31);
      e.setHours(23, 59, 59, 999);
      return { start: m, end: e, label: 'Año actual' };
    }
    default: {
      void start;
      void end;
      return getRangeDates('month', now);
    }
  }
}

export function getTodayDateRange(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getLastYearDateRange(now: Date = new Date()): { start: Date; end: Date } {
  const end = new Date(now);
  const start = new Date(now);
  start.setFullYear(start.getFullYear() - 1);
  return { start, end };
}

export function getThisMonthDateRange(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function emptyStatusMap(statuses: readonly AppointmentStatus[]): Record<AppointmentStatus, number> {
  return statuses.reduce((acc, s) => {
    acc[s] = 0;
    return acc;
  }, {} as Record<AppointmentStatus, number>);
}

interface VetFilter {
  vetId?: string;
}

function buildVetFilter(user: DashboardUser): VetFilter {
  if (user.role === 'VET') {
    return { vetId: user.userId };
  }
  return {};
}

export interface DashboardMetrics {
  range: DashboardRange;
  rangeLabel: string;
  generatedAt: Date;
  today: {
    total: number;
    byStatus: Record<AppointmentStatus, number>;
  };
  pets: {
    active: number;
    newThisMonth: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  appointmentsByStatus: Record<AppointmentStatus, number>;
  speciesDistribution: { species: string; count: number }[];
  upcomingAppointments: {
    id: string;
    date: Date;
    reason: string;
    status: AppointmentStatus;
    petId: string;
    petName: string;
    ownerName: string;
    vetId: string | null;
    vetName: string | null;
    categoryName: string;
    categoryColor: string;
  }[];
  topVets: { vetId: string; vetName: string; count: number }[];
}

export async function computeDashboardMetrics(
  prisma: PrismaClient,
  user: DashboardUser,
  range: DashboardRange,
  now: Date = new Date()
): Promise<DashboardMetrics> {
  const rangeDates = getRangeDates(range, now);
  const todayRange = getTodayDateRange(now);
  const lastYearRange = getLastYearDateRange(now);
  const thisMonthRange = getThisMonthDateRange(now);

  const vetFilter = buildVetFilter(user);

  const [
    todayTotal,
    todayGroups,
    rangeGroups,
    speciesGroups,
    activePets,
    newThisMonth,
    upcoming,
    topVetGroups,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        ...vetFilter,
        date: { gte: todayRange.start, lte: todayRange.end },
      },
    }),
    prisma.appointment.groupBy({
      by: ['status'],
      where: {
        ...vetFilter,
        date: { gte: todayRange.start, lte: todayRange.end },
      },
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ['status'],
      where: {
        ...vetFilter,
        date: { gte: rangeDates.start, lte: rangeDates.end },
      },
      _count: { _all: true },
    }),
    prisma.pet.groupBy({
      by: ['species'],
      _count: { _all: true },
    }),
    prisma.pet.findMany({
      where: {
        OR: [
          { appointments: { some: { date: { gte: lastYearRange.start, lte: lastYearRange.end } } } },
          {
            appointments: {
              some: {
                date: { gte: now },
                status: { in: ['PENDING', 'CONFIRMED'] },
              },
            },
          },
        ],
      },
      select: { id: true },
    }),
    prisma.pet.count({
      where: {
        createdAt: { gte: thisMonthRange.start, lte: thisMonthRange.end },
      },
    }),
    prisma.appointment.findMany({
      where: {
        ...vetFilter,
        date: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      orderBy: { date: 'asc' },
      take: 5,
      include: {
        pet: { select: { id: true, name: true, owner: { select: { firstName: true, lastName: true } } } },
        vet: { select: { id: true, firstName: true, lastName: true } },
        category: { select: { name: true, color: true } },
      },
    }),
    prisma.appointment.groupBy({
      by: ['vetId'],
      where: {
        ...vetFilter,
        date: { gte: rangeDates.start, lte: rangeDates.end },
      },
      _count: { _all: true },
      orderBy: { _count: { vetId: 'desc' } },
      take: 5,
    }),
  ]);

  const todayByStatus = emptyStatusMap(ALL_APPOINTMENT_STATUSES);
  for (const g of todayGroups) {
    todayByStatus[g.status] = g._count._all;
  }

  const appointmentsByStatus = emptyStatusMap(ALL_APPOINTMENT_STATUSES);
  for (const g of rangeGroups) {
    appointmentsByStatus[g.status] = g._count._all;
  }

  const speciesDistribution = speciesGroups
    .map((g) => ({ species: g.species, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  const upcomingAppointments = upcoming.map((a) => ({
    id: a.id,
    date: a.date,
    reason: a.reason,
    status: a.status,
    petId: a.pet.id,
    petName: a.pet.name,
    ownerName: `${a.pet.owner.firstName} ${a.pet.owner.lastName}`.trim(),
    vetId: a.vet?.id ?? null,
    vetName: a.vet ? `${a.vet.firstName} ${a.vet.lastName}`.trim() : null,
    categoryName: a.category.name,
    categoryColor: a.category.color,
  }));

  let topVets: { vetId: string; vetName: string; count: number }[] = [];
  if (topVetGroups.length > 0) {
    const vetIds = topVetGroups
      .map((g) => g.vetId)
      .filter((id): id is string => id !== null);
    if (vetIds.length > 0) {
      const vets = await prisma.user.findMany({
        where: { id: { in: vetIds } },
        select: { id: true, firstName: true, lastName: true },
      });
      const vetMap = new Map(vets.map((v) => [v.id, v]));
      topVets = topVetGroups
        .filter((g) => g.vetId !== null)
        .map((g) => {
          const id = g.vetId as string;
          const v = vetMap.get(id);
          return {
            vetId: id,
            vetName: v ? `${v.firstName} ${v.lastName}`.trim() : `Vet #${id}`,
            count: g._count._all,
          };
        });
    }
  }

  // TODO: Reemplazar placeholders cuando exista modelo Invoice o campo price en Category.
  const revenue = {
    thisMonth: 0,
    lastMonth: 0,
    percentChange: 0,
  };

  return {
    range,
    rangeLabel: rangeDates.label,
    generatedAt: now,
    today: { total: todayTotal, byStatus: todayByStatus },
    pets: {
      active: activePets.length,
      newThisMonth,
    },
    revenue,
    appointmentsByStatus,
    speciesDistribution,
    upcomingAppointments,
    topVets,
  };
}
