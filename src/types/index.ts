export type Role = 'ADMIN' | 'VET' | 'RECEPTIONIST' | 'CLIENT';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: Date;
}

export interface PetDTO {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: Date | null;
  weight: number | null;
  ownerId: string;
  owner?: UserDTO;
  createdAt: Date;
}

export interface AppointmentDTO {
  id: string;
  date: Date;
  reason: string;
  status: AppointmentStatus;
  notes: string | null;
  petId: string;
  vetId: string | null;
  pet?: PetDTO;
  vet?: UserDTO | null;
  createdAt: Date;
}

export type DewormingType = 'INTERNAL' | 'EXTERNAL' | 'BOTH';

export interface VitalSignsDTO {
  id: string;
  weight: number | null;
  temperature: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  capillaryRefillTime: string | null;
  dehydrationPercentage: number | null;
  mucousMembranes: string | null;
  medicalRecordId: string;
}

export interface ExamAttachmentDTO {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  description: string | null;
  medicalRecordId: string;
  createdAt: Date;
}

export interface VaccinationDTO {
  id: string;
  vaccineName: string;
  vaccineType: string;
  administrationDate: Date;
  nextDoseDate: Date | null;
  lotNumber: string | null;
  manufacturer: string | null;
  veterinarian: string | null;
  petId: string;
  createdById: string;
  createdAt: Date;
}

export interface DewormingDTO {
  id: string;
  productName: string;
  type: DewormingType;
  dosage: string | null;
  date: Date;
  nextDate: Date | null;
  petId: string;
  createdById: string;
  createdAt: Date;
}

export interface SurgicalHistoryDTO {
  id: string;
  procedure: string;
  date: Date | null;
  complications: string | null;
  notes: string | null;
  outcomes: string | null;
  petId: string;
  createdAt: Date;
}

export interface ChronicConditionDTO {
  id: string;
  name: string;
  type: string;
  severity: string | null;
  diagnosisDate: Date | null;
  notes: string | null;
  isActive: boolean;
  petId: string;
  createdAt: Date;
}

export interface MedicalRecordDTO {
  id: string;
  date: Date;
  title: string;
  diagnosis: string | null;
  treatment: string | null;
  publicNotes: string;
  privateNotes: string | null;
  petId: string;
  vetId: string;
  pet?: PetDTO;
  vet?: UserDTO;
  vitals?: VitalSignsDTO | null;
  exams?: ExamAttachmentDTO[];
  createdAt: Date;
}

export type DashboardRange = 'month' | 'prev' | 'quarter' | 'year';

export interface DashboardTodayDTO {
  total: number;
  byStatus: Record<AppointmentStatus, number>;
}

export interface DashboardPetsDTO {
  active: number;
  newThisMonth: number;
}

export interface DashboardRevenueDTO {
  thisMonth: number;
  lastMonth: number;
  percentChange: number;
}

export interface DashboardUpcomingAppointmentDTO {
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
}

export interface DashboardSpeciesBucketDTO {
  species: string;
  count: number;
}

export interface DashboardTopVetDTO {
  vetId: string;
  vetName: string;
  count: number;
}

export interface DashboardMetricsDTO {
  range: DashboardRange;
  rangeLabel: string;
  generatedAt: Date;
  today: DashboardTodayDTO;
  pets: DashboardPetsDTO;
  revenue: DashboardRevenueDTO;
  appointmentsByStatus: Record<AppointmentStatus, number>;
  speciesDistribution: DashboardSpeciesBucketDTO[];
  upcomingAppointments: DashboardUpcomingAppointmentDTO[];
  topVets: DashboardTopVetDTO[];
}