import {
  computeDashboardMetrics,
  getRangeDates,
  getTodayDateRange,
  getLastYearDateRange,
  getThisMonthDateRange,
  ALL_APPOINTMENT_STATUSES,
  type DashboardUser,
} from '@/services/dashboard-metrics';type PrismaMock = {
  appointment: {
    count: jest.Mock;
    groupBy: jest.Mock;
    findMany: jest.Mock;
  };
  pet: {
    groupBy: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  user: {
    findMany: jest.Mock;
  };
};

function createPrismaMock(): PrismaMock {
  return {
    appointment: {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    pet: {
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

function asPrisma(mock: PrismaMock): Parameters<typeof computeDashboardMetrics>[0] {
  return mock as unknown as Parameters<typeof computeDashboardMetrics>[0];
}

const adminUser: DashboardUser = { userId: 'a0000000-0000-0000-0000-000000000001', role: 'ADMIN', firstName: 'Admin', lastName: 'Root', email: 'admin@test.com' };
const vetUser: DashboardUser = { userId: 'a0000000-0000-0000-0000-000000000007', role: 'VET', firstName: 'Ana', lastName: 'Vet', email: 'ana@test.com' };
const receptUser: DashboardUser = { userId: 'a0000000-0000-0000-0000-000000000003', role: 'RECEPTIONIST', firstName: 'Re', lastName: 'Cep', email: 'r@test.com' };

describe('dashboard-metrics service', () => {
  describe('getRangeDates', () => {
    it('returns month range covering current month', () => {
      const now = new Date(2026, 6, 15, 12, 0, 0);
      const { start, end, label } = getRangeDates('month', now);
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(6);
      expect(start.getDate()).toBe(1);
      expect(end.getMonth()).toBe(6);
      expect(end.getDate()).toBe(31);
      expect(label).toBe('Mes actual');
    });

    it('returns prev range covering previous month', () => {
      const now = new Date(2026, 6, 15);
      const { start, end } = getRangeDates('prev', now);
      expect(start.getMonth()).toBe(5);
      expect(end.getMonth()).toBe(5);
      expect(end.getDate()).toBe(30);
    });

    it('returns quarter range aligned to current quarter', () => {
      const now = new Date(2026, 7, 1);
      const { start, end } = getRangeDates('quarter', now);
      expect(start.getMonth()).toBe(6);
      expect(end.getMonth()).toBe(8);
      expect(end.getDate()).toBe(30);
    });

    it('returns year range', () => {
      const now = new Date(2026, 5, 5);
      const { start, end } = getRangeDates('year', now);
      expect(start.getMonth()).toBe(0);
      expect(end.getMonth()).toBe(11);
      expect(end.getDate()).toBe(31);
    });

    it('falls back to month on unknown range', () => {
      const now = new Date(2026, 3, 10);
      const { start, end } = getRangeDates('unknown' as never, now);
      expect(start.getMonth()).toBe(3);
      expect(end.getMonth()).toBe(3);
    });
  });

  describe('getTodayDateRange', () => {
    it('covers 00:00:00 to 23:59:59', () => {
      const now = new Date(2026, 4, 20, 14, 30, 0);
      const r = getTodayDateRange(now);
      expect(r.start.getHours()).toBe(0);
      expect(r.end.getHours()).toBe(23);
      expect(r.end.getMinutes()).toBe(59);
      expect(r.start.getDate()).toBe(20);
    });
  });

  describe('getLastYearDateRange', () => {
    it('returns exactly one year window', () => {
      const now = new Date(2026, 4, 20);
      const r = getLastYearDateRange(now);
      const diff = r.end.getTime() - r.start.getTime();
      expect(diff).toBeGreaterThan(360 * 24 * 3600 * 1000);
    });
  });

  describe('getThisMonthDateRange', () => {
    it('starts on day 1 and ends on last day of month', () => {
      const r = getThisMonthDateRange(new Date(2026, 1, 15));
      expect(r.start.getDate()).toBe(1);
      expect(r.end.getDate()).toBeGreaterThan(27);
    });
  });

  describe('computeDashboardMetrics', () => {
    const now = new Date(2026, 6, 15, 12, 0, 0);
    const todayRange = getTodayDateRange(now);

    it('initialises all status counts to 0', async () => {
      const mock = createPrismaMock();
      const result = await computeDashboardMetrics(asPrisma(mock), adminUser, 'month');
      for (const s of ALL_APPOINTMENT_STATUSES) {
        expect(result.appointmentsByStatus[s]).toBe(0);
        expect(result.today.byStatus[s]).toBe(0);
      }
    });

    it('places today totals and totals per status map', async () => {
      const mock = createPrismaMock();
      (mock.appointment.count as jest.Mock).mockResolvedValueOnce(4);
      (mock.appointment.groupBy as jest.Mock).mockImplementation((args: { where: { date?: { gte?: Date; lte?: Date } } }) => {
        const gte = args?.where?.date?.gte;
        const start = todayRange.start;
        if (gte && gte.getTime() === start.getTime()) {
          return Promise.resolve([
            { status: 'PENDING', _count: { _all: 1 } },
            { status: 'CONFIRMED', _count: { _all: 3 } },
          ]);
        }
        return Promise.resolve([
          { status: 'COMPLETED', _count: { _all: 12 } },
          { status: 'CANCELLED', _count: { _all: 5 } },
        ]);
      });
      const r = await computeDashboardMetrics(asPrisma(mock), adminUser, 'month', now);
      expect(r.today.total).toBe(4);
      expect(r.today.byStatus.PENDING).toBe(1);
      expect(r.today.byStatus.CONFIRMED).toBe(3);
      expect(r.today.byStatus.COMPLETED).toBe(0);
      expect(r.appointmentsByStatus.COMPLETED).toBe(12);
      expect(r.appointmentsByStatus.CANCELLED).toBe(5);
    });

    it('sorts species by count desc', async () => {
      const mock = createPrismaMock();
      (mock.pet.groupBy as jest.Mock).mockResolvedValueOnce([
        { species: 'Gato', _count: { _all: 3 } },
        { species: 'Perro', _count: { _all: 10 } },
        { species: 'Ave', _count: { _all: 1 } },
      ]);
      const r = await computeDashboardMetrics(asPrisma(mock), adminUser, 'month');
      expect(r.speciesDistribution[0].species).toBe('Perro');
      expect(r.speciesDistribution[0].count).toBe(10);
    });

    it('counts active pets from returned ids', async () => {
      const mock = createPrismaMock();
      (mock.pet.findMany as jest.Mock).mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }]);
      (mock.pet.count as jest.Mock).mockResolvedValueOnce(2);
      const r = await computeDashboardMetrics(asPrisma(mock), adminUser, 'month');
      expect(r.pets.active).toBe(3);
      expect(r.pets.newThisMonth).toBe(2);
    });

    it('maps upcoming appointments (ownerName joined, vet null safe)', async () => {
      const mock = createPrismaMock();
      (mock.appointment.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 11,
          date: new Date('2026-07-10T10:00:00Z'),
          reason: 'Vacunación',
          status: 'CONFIRMED',
          pet: { id: 1, name: 'Firulais', owner: { firstName: 'Juan', lastName: 'Pérez' } },
          vet: { id: 7, firstName: 'Ana', lastName: 'Vet' },
          category: { name: 'Vacuna', color: '#3b82f6' },
        },
        {
          id: 12,
          date: new Date('2026-07-11T11:00:00Z'),
          reason: 'Control',
          status: 'PENDING',
          pet: { id: 2, name: 'Mishi', owner: { firstName: 'Maria', lastName: 'Soto' } },
          vet: null,
          category: { name: 'General', color: '#10b981' },
        },
      ]);
      const r = await computeDashboardMetrics(asPrisma(mock), adminUser, 'month');
      expect(r.upcomingAppointments).toHaveLength(2);
      expect(r.upcomingAppointments[0].ownerName).toBe('Juan Pérez');
      expect(r.upcomingAppointments[0].vetName).toBe('Ana Vet');
      expect(r.upcomingAppointments[1].vetName).toBeNull();
      expect(r.upcomingAppointments[0].categoryName).toBe('Vacuna');
    });

    it('maps topVets grouped by vetId', async () => {
      const mock = createPrismaMock();
      (mock.appointment.groupBy as jest.Mock).mockImplementation((args: { by: string[] }) => {
        if (args.by.includes('vetId')) {
          return Promise.resolve([
            { vetId: 7, _count: { _all: 18 } },
            { vetId: 8, _count: { _all: 12 } },
          ]);
        }
        return Promise.resolve([]);
      });
      (mock.user.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 7, firstName: 'Ana', lastName: 'Vet' },
        { id: 8, firstName: 'Pedro', lastName: 'Vet' },
      ]);
      const r = await computeDashboardMetrics(asPrisma(mock), adminUser, 'month');
      expect(r.topVets).toEqual([
        { vetId: 7, vetName: 'Ana Vet', count: 18 },
        { vetId: 8, vetName: 'Pedro Vet', count: 12 },
      ]);
    });

    it('keeps revenue as placeholders (TODO invoice model)', async () => {
      const mock = createPrismaMock();
      const r = await computeDashboardMetrics(asPrisma(mock), adminUser, 'month');
      expect(r.revenue).toEqual({ thisMonth: 0, lastMonth: 0, percentChange: 0 });
    });

    it('applies vetId filter for VET role (RN-16)', async () => {
      const mock = createPrismaMock();
      await computeDashboardMetrics(asPrisma(mock), vetUser, 'month');
      const countCalls = (mock.appointment.count as jest.Mock).mock.calls;
      const findManyCalls = (mock.appointment.findMany as jest.Mock).mock.calls;
      const groupByCalls = (mock.appointment.groupBy as jest.Mock).mock.calls;

      const allCalls = [...countCalls, ...findManyCalls, ...groupByCalls];
      for (const callArgs of allCalls) {
        const where = callArgs[0]?.where ?? {};
        expect(where.vetId).toBe(7);
      }
    });

    it('does NOT add vetId filter for ADMIN', async () => {
      const mock = createPrismaMock();
      await computeDashboardMetrics(asPrisma(mock), adminUser, 'month');
      const countCalls = (mock.appointment.count as jest.Mock).mock.calls;
      for (const callArgs of countCalls) {
        const where = callArgs[0]?.where ?? {};
        expect(where.vetId).toBeUndefined();
      }
    });

    it('does NOT add vetId filter for RECEPTIONIST', async () => {
      const mock = createPrismaMock();
      await computeDashboardMetrics(asPrisma(mock), receptUser, 'prev');
      const countCalls = (mock.appointment.count as jest.Mock).mock.calls;
      for (const callArgs of countCalls) {
        const where = callArgs[0]?.where ?? {};
        expect(where.vetId).toBeUndefined();
      }
    });

    it('hides topVets without fetching users when no groups', async () => {
      const mock = createPrismaMock();
      (mock.appointment.groupBy as jest.Mock).mockImplementation(() => Promise.resolve([]));
      const r = await computeDashboardMetrics(asPrisma(mock), adminUser, 'year');
      expect(r.topVets).toEqual([]);
      expect(mock.user.findMany).not.toHaveBeenCalled();
    });
  });
});
