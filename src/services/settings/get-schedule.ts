import { prisma } from '@/lib/prisma';

export interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

export type WeeklySchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

export const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: { enabled: true, open: '09:00', close: '19:00' },
  tuesday: { enabled: true, open: '09:00', close: '19:00' },
  wednesday: { enabled: true, open: '09:00', close: '19:00' },
  thursday: { enabled: true, open: '09:00', close: '19:00' },
  friday: { enabled: true, open: '09:00', close: '19:00' },
  saturday: { enabled: true, open: '09:00', close: '14:00' },
  sunday: { enabled: false, open: '09:00', close: '14:00' },
};

export async function getSchedule(): Promise<WeeklySchedule> {
  try {
    const setting = await prisma.clinicSetting.findUnique({
      where: { key: 'schedule' },
    });
    if (setting && setting.value && typeof setting.value === 'object') {
      return { ...DEFAULT_SCHEDULE, ...(setting.value as Partial<WeeklySchedule>) };
    }
  } catch (err) {
    console.warn('[getSchedule] Falling back to defaults:', err);
  }
  return DEFAULT_SCHEDULE;
}

export async function saveSchedule(schedule: WeeklySchedule, updatedById?: string) {
  await prisma.clinicSetting.upsert({
    where: { key: 'schedule' },
    update: {
      value: schedule as unknown as object,
      updatedById: updatedById ?? null,
    },
    create: {
      key: 'schedule',
      value: schedule as unknown as object,
      updatedById: updatedById ?? null,
    },
  });
}

const DAY_KEYS: (keyof WeeklySchedule)[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

export function dayKeyFromDate(date: Date): keyof WeeklySchedule {
  return DAY_KEYS[date.getDay()];
}
