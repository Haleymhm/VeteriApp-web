import { z } from 'zod';

export const Role = z.enum(['ADMIN', 'VET', 'RECEPTIONIST', 'CLIENT']);
export type Role = z.infer<typeof Role>;

export const AppointmentStatus = z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);
export type AppointmentStatus = z.infer<typeof AppointmentStatus>;

export const Sex = z.enum(['MALE', 'FEMALE']);
export type Sex = z.infer<typeof Sex>;

export const ReproductiveStatus = z.enum(['FERTILE', 'STERILIZED', 'CASTRATED']);
export type ReproductiveStatus = z.infer<typeof ReproductiveStatus>;

export const DewormingType = z.enum(['INTERNAL', 'EXTERNAL', 'BOTH']);
export type DewormingType = z.infer<typeof DewormingType>;

export const VitalSignsSchema = z.object({
  weight: z.number().positive('El peso debe ser un número positivo').optional(),
  temperature: z.number().positive('La temperatura debe ser un número positivo').optional(),
  heartRate: z.number().int().positive('La frecuencia cardíaca debe ser un número positivo').optional(),
  respiratoryRate: z.number().int().positive('La frecuencia respiratoria debe ser un número positivo').optional(),
  capillaryRefillTime: z.string().optional(),
  dehydrationPercentage: z.number().min(0).max(100, 'El porcentaje debe estar entre 0 y 100').optional(),
  mucousMembranes: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña es requerida'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  firstName: z.string().min(1, 'Nombre es requerido'),
  lastName: z.string().min(1, 'Apellido es requerido'),
  role: Role.optional().default('CLIENT'),
});

export const CreateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  firstName: z.string().min(1, 'Nombre es requerido'),
  lastName: z.string().min(1, 'Apellido es requerido'),
  role: z.enum(['ADMIN', 'VET', 'RECEPTIONIST']),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1, 'Nombre es requerido').optional(),
  lastName: z.string().min(1, 'Apellido es requerido').optional(),
  role: z.enum(['ADMIN', 'VET', 'RECEPTIONIST', 'CLIENT']).optional(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .optional(),
});

export const CreateClientSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  firstName: z.string().min(1, 'Nombre es requerido'),
  lastName: z.string().min(1, 'Apellido es requerido'),
  rut: z.string().min(1, 'RUT es requerido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  regionId: z.string().optional(),
  comunaId: z.string().optional(),
});

export const UpdateClientSchema = z.object({
  firstName: z.string().min(1, 'Nombre es requerido').optional(),
  lastName: z.string().min(1, 'Apellido es requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .optional(),
  rut: z.string().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  regionId: z.string().nullable().optional(),
  comunaId: z.string().nullable().optional(),
});

const DateInput = z
  .string()
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    { message: 'Fecha inválida' }
  )
  .transform((value) => new Date(value));

const DateInputRequired = z
  .string()
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    { message: 'Fecha inválida' }
  )
  .transform((value) => new Date(value));

const DateInputNullable = z
  .string()
  .nullable()
  .refine(
    (value) => value === null || !Number.isNaN(Date.parse(value)),
    { message: 'Fecha inválida' }
  )
  .transform((value) => (value === null ? null : new Date(value)));

export const UuidParamSchema = z.string().uuid('ID inválido');

const OwnerIdInput = z.string().uuid('ownerId inválido');

export const CreatePetSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  species: z.string().min(1, 'Especie es requerida'),
  breed: z.string().optional(),
  birthDate: DateInput.optional(),
  weight: z.number().positive('El peso debe ser un número positivo').optional(),
  sex: Sex.optional(),
  reproductiveStatus: ReproductiveStatus.optional(),
  specialCharacteristics: z.string().optional(),
  microchipNumber: z.string().optional(),
  ownerId: OwnerIdInput.optional(),
});

export const UpdatePetSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').optional(),
  species: z.string().min(1, 'Especie es requerida').optional(),
  breed: z.string().nullable().optional(),
  birthDate: DateInputNullable.optional(),
  weight: z.number().positive('El peso debe ser un número positivo').nullable().optional(),
  sex: Sex.nullable().optional(),
  reproductiveStatus: ReproductiveStatus.nullable().optional(),
  specialCharacteristics: z.string().nullable().optional(),
  microchipNumber: z.string().nullable().optional(),
});

export const CreateAppointmentSchema = z.object({
  date: DateInputRequired,
  reason: z.string().min(1, 'Motivo es requerido'),
  categoryId: z.string().uuid('ID de categoría inválido'),
  petId: z.string().uuid('ID de mascota inválido'),
  vetId: z.string().uuid('ID de veterinario inválido').optional(),
  notes: z.string().optional(),
  status: AppointmentStatus.optional(),
});

export const UpdateAppointmentSchema = z.object({
  date: DateInput.optional(),
  reason: z.string().min(1, 'Motivo es requerido').optional(),
  status: AppointmentStatus.optional(),
  notes: z.string().nullable().optional(),
  vetId: z.string().uuid('ID de veterinario inválido').nullable().optional(),
  petId: z.string().uuid('ID de mascota inválido').optional(),
  categoryId: z.string().uuid('ID de categoría inválido').optional(),
});

export const CreateMedicalRecordSchema = z.object({
  date: DateInput.optional(),
  title: z.string().min(1, 'Título es requerido'),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  publicNotes: z.string().min(1, 'Notas públicas son requeridas'),
  privateNotes: z.string().optional(),
  petId: z.string().uuid('ID de mascota inválido'),
  vitals: VitalSignsSchema.optional(),
});

export const UpdateMedicalRecordSchema = z.object({
  date: DateInputNullable.optional(),
  title: z.string().min(1, 'Título es requerido').optional(),
  diagnosis: z.string().nullable().optional(),
  treatment: z.string().nullable().optional(),
  publicNotes: z.string().min(1, 'Notas públicas son requeridas').optional(),
  privateNotes: z.string().nullable().optional(),
  vitals: VitalSignsSchema.partial().optional(),
});

export const CreateExamAttachmentSchema = z.object({
  fileName: z.string().min(1, 'Nombre de archivo es requerido'),
  fileUrl: z.string().url('URL de archivo inválida'),
  fileType: z.string().min(1, 'Tipo de archivo es requerido'),
  description: z.string().optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  color: z.string().min(1, 'Color es requerido'),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').optional(),
  color: z.string().min(1, 'Color es requerido').optional(),
});

export const CreateVaccinationSchema = z.object({
  vaccineName: z.string().min(1, 'Nombre de vacuna es requerido'),
  vaccineType: z.string().min(1, 'Tipo de vacuna es requerido'),
  administrationDate: DateInput.optional(),
  nextDoseDate: DateInputNullable.optional(),
  lotNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  //veterinarian: z.string().optional(),
});

export const CreateDewormingSchema = z.object({
  productName: z.string().min(1, 'Nombre del producto es requerido'),
  type: DewormingType,
  dosage: z.string().optional(),
  date: DateInput.optional(),
  nextDate: DateInputNullable.optional(),
});

export const CreateSurgicalHistorySchema = z.object({
  procedure: z.string().min(1, 'Procedimiento es requerido'),
  date: DateInputNullable.optional(),
  complications: z.string().optional(),
  notes: z.string().optional(),
  outcomes: z.string().optional(),
});

export const CreateChronicConditionSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  type: z.string().min(1, 'Tipo es requerido'),
  severity: z.string().optional(),
  diagnosisDate: DateInputNullable.optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const CreateRegionSchema = z.object({
  code: z.string().min(1, 'Código es requerido'),
  name: z.string().min(1, 'Nombre es requerido'),
});

export const CreateComunaSchema = z.object({
  code: z.string().min(1, 'Código es requerido'),
  name: z.string().min(1, 'Nombre es requerido'),
  regionId: z.string().uuid('ID de región inválido'),
});

export const DashboardRangeSchema = z.enum(['month', 'prev', 'quarter', 'year']);
export type DashboardRangeInput = z.infer<typeof DashboardRangeSchema>;

export const DashboardQuerySchema = z.object({
  range: DashboardRangeSchema.optional().default('month'),
});
export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'Nombre es requerido').max(100),
  lastName: z.string().min(1, 'Apellido es requerido').max(100),
  email: z.string().email('Email inválido'),
  phone: z.string().max(30).nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  regionId: z.string().nullable().optional(),
  comunaId: z.string().nullable().optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token es requerido'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Debe ser un color hex válido (#RRGGBB)');

const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:MM requerido');

const DayScheduleSchema = z.object({
  enabled: z.boolean(),
  open: TimeSchema,
  close: TimeSchema,
}).refine(
  (data) => !data.enabled || data.open < data.close,
  { message: 'La hora de apertura debe ser anterior a la de cierre', path: ['close'] }
);

export const UpdateScheduleSchema = z.object({
  monday: DayScheduleSchema,
  tuesday: DayScheduleSchema,
  wednesday: DayScheduleSchema,
  thursday: DayScheduleSchema,
  friday: DayScheduleSchema,
  saturday: DayScheduleSchema,
  sunday: DayScheduleSchema,
});

export const CreateHolidaySchema = z.object({
  date: DateInputRequired,
  label: z.string().min(1, 'Etiqueta requerida').max(100),
});

export const UpdateBrandingSchema = z.object({
  clinicName: z.string().min(1, 'Nombre requerido').max(100),
  primaryColor: HexColorSchema,
  secondaryColor: HexColorSchema,
  footerText: z.string().min(1, 'Texto de pie requerido').max(200),
  fromEmail: z.string().email('Email inválido'),
});

export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: firstError
        ? `${firstError.path.join('.')}: ${firstError.message}`
        : 'Datos inválidos',
    };
  }

  return { success: true, data: result.data };
}

export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; error: string } {
  const obj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  return validateBody(schema, obj);
}