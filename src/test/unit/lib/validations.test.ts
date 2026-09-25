import {
  LoginSchema,
  RegisterSchema,
  CreateUserSchema,
  UpdateUserSchema,
  CreateClientSchema,
  UpdateClientSchema,
  CreatePetSchema,
  UpdatePetSchema,
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
  CreateMedicalRecordSchema,
  UpdateMedicalRecordSchema,
  CreateExamAttachmentSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CreateVaccinationSchema,
  CreateDewormingSchema,
  CreateSurgicalHistorySchema,
  CreateChronicConditionSchema,
  CreateRegionSchema,
  CreateComunaSchema,
  VitalSignsSchema,
  Role,
  AppointmentStatus,
  Sex,
  ReproductiveStatus,
  DewormingType,
  validateBody,
} from '@/lib/validations';

describe('Validations - Enums', () => {
  describe('Role', () => {
    it('should accept valid roles', () => {
      expect(Role.parse('ADMIN')).toBe('ADMIN');
      expect(Role.parse('VET')).toBe('VET');
      expect(Role.parse('RECEPTIONIST')).toBe('RECEPTIONIST');
      expect(Role.parse('CLIENT')).toBe('CLIENT');
    });

    it('should reject invalid role', () => {
      expect(() => Role.parse('SUPERADMIN')).toThrow();
    });
  });

  describe('AppointmentStatus', () => {
    it('should accept valid statuses', () => {
      expect(AppointmentStatus.parse('PENDING')).toBe('PENDING');
      expect(AppointmentStatus.parse('CONFIRMED')).toBe('CONFIRMED');
      expect(AppointmentStatus.parse('COMPLETED')).toBe('COMPLETED');
      expect(AppointmentStatus.parse('CANCELLED')).toBe('CANCELLED');
      expect(AppointmentStatus.parse('NO_SHOW')).toBe('NO_SHOW');
    });

    it('should reject invalid status', () => {
      expect(() => AppointmentStatus.parse('INVALID')).toThrow();
    });
  });

  describe('Sex', () => {
    it('should accept valid sexes', () => {
      expect(Sex.parse('MALE')).toBe('MALE');
      expect(Sex.parse('FEMALE')).toBe('FEMALE');
    });

    it('should reject invalid sex', () => {
      expect(() => Sex.parse('OTHER')).toThrow();
    });
  });

  describe('ReproductiveStatus', () => {
    it('should accept valid statuses', () => {
      expect(ReproductiveStatus.parse('FERTILE')).toBe('FERTILE');
      expect(ReproductiveStatus.parse('STERILIZED')).toBe('STERILIZED');
      expect(ReproductiveStatus.parse('CASTRATED')).toBe('CASTRATED');
    });
  });

  describe('DewormingType', () => {
    it('should accept valid types', () => {
      expect(DewormingType.parse('INTERNAL')).toBe('INTERNAL');
      expect(DewormingType.parse('EXTERNAL')).toBe('EXTERNAL');
      expect(DewormingType.parse('BOTH')).toBe('BOTH');
    });
  });
});

describe('Validations - Auth Schemas', () => {
  describe('LoginSchema', () => {
    it('should accept valid email and password', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should reject invalid email', () => {
      const result = LoginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing fields', () => {
      const result = LoginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterSchema', () => {
    const validData = {
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should accept valid registration data', () => {
      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject password without uppercase', () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mayúscula');
      }
    });

    it('should reject password without number', () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        password: 'PasswordNoNumber',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('número');
      }
    });

    it('should reject short password', () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        password: 'Pass1',
      });
      expect(result.success).toBe(false);
    });

    it('should accept CLIENT role by default', () => {
      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('CLIENT');
      }
    });

    it('should reject empty firstName', () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        firstName: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty lastName', () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        lastName: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateUserSchema', () => {
    const validData = {
      email: 'admin@example.com',
      password: 'AdminPass123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN' as const,
    };

    it('should accept valid admin user data', () => {
      const result = CreateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject CLIENT role for admin creation', () => {
      const result = CreateUserSchema.safeParse({
        ...validData,
        role: 'CLIENT',
      });
      expect(result.success).toBe(false);
    });

    it('should accept VET role', () => {
      const result = CreateUserSchema.safeParse({
        ...validData,
        role: 'VET',
      });
      expect(result.success).toBe(true);
    });

    it('should accept RECEPTIONIST role', () => {
      const result = CreateUserSchema.safeParse({
        ...validData,
        role: 'RECEPTIONIST',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateUserSchema', () => {
    it('should accept partial updates', () => {
      const result = UpdateUserSchema.safeParse({ firstName: 'Jane' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = UpdateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept role update', () => {
      const result = UpdateUserSchema.safeParse({ role: 'VET' });
      expect(result.success).toBe(true);
    });
  });
});

describe('Validations - Client Schemas', () => {
  const validClient = {
    email: 'client@example.com',
    password: 'ClientPass123',
    firstName: 'Client',
    lastName: 'User',
    rut: '12.345.678-9',
    phone: '+56912345678',
    address: 'Calle Principal 123',
    regionId: 'uuid-region',
    comunaId: 'uuid-comuna',
  };

  describe('CreateClientSchema', () => {
    it('should accept valid client data', () => {
      const result = CreateClientSchema.safeParse(validClient);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = CreateClientSchema.safeParse({
        ...validClient,
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });

    it('should require RUT', () => {
      const result = CreateClientSchema.safeParse({
        ...validClient,
        rut: '',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional phone', () => {
      const result = CreateClientSchema.safeParse({
        ...validClient,
        phone: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional address', () => {
      const result = CreateClientSchema.safeParse({
        ...validClient,
        address: undefined,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateClientSchema', () => {
    it('should accept partial updates', () => {
      const result = UpdateClientSchema.safeParse({ phone: '+56987654321' });
      expect(result.success).toBe(true);
    });

    it('should accept null for nullable fields', () => {
      const result = UpdateClientSchema.safeParse({
        phone: null,
        address: null,
      });
      expect(result.success).toBe(true);
    });

    it('should accept email update', () => {
      const result = UpdateClientSchema.safeParse({
        email: 'newemail@example.com',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Validations - Pet Schemas', () => {
  const validPet = {
    name: 'Firulais',
    species: 'Canino',
    breed: 'Labrador',
    birthDate: '2022-01-15T00:00:00.000Z',
    weight: 25.5,
    sex: 'MALE' as const,
    reproductiveStatus: 'FERTILE' as const,
    specialCharacteristics: 'Muy juguetón',
    microchipNumber: '123456789012345',
    ownerId: 'a0000000-0000-0000-0000-000000000001',
  };

  describe('CreatePetSchema', () => {
    it('should accept valid pet data', () => {
      const result = CreatePetSchema.safeParse(validPet);
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const result = CreatePetSchema.safeParse({ species: 'Canino' });
      expect(result.success).toBe(false);
    });

    it('should require species', () => {
      const result = CreatePetSchema.safeParse({ name: 'Firulais' });
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const result = CreatePetSchema.safeParse({ name: 'Firulais', species: 'Canino' });
      expect(result.success).toBe(true);
    });

    it('should reject negative weight', () => {
      const result = CreatePetSchema.safeParse({ ...validPet, weight: -5 });
      expect(result.success).toBe(false);
    });

    it('should accept valid birthDate', () => {
      const result = CreatePetSchema.safeParse({
        ...validPet,
        birthDate: '2023-06-15T10:00:00.000Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.birthDate).toBeInstanceOf(Date);
      }
    });

    it('should accept date-only birthDate from <input type="date">', () => {
      const result = CreatePetSchema.safeParse({
        ...validPet,
        birthDate: '2022-12-24',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.birthDate).toBeInstanceOf(Date);
      }
    });

    it('should reject invalid date format', () => {
      const result = CreatePetSchema.safeParse({
        ...validPet,
        birthDate: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });

    it('should accept ownerId as a valid UUID string', () => {
      const result = CreatePetSchema.safeParse({ ...validPet, ownerId: 'a0000000-0000-0000-0000-000000000001' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ownerId).toBe('a0000000-0000-0000-0000-000000000001');
      }
    });

    it('should reject non-UUID ownerId string', () => {
      const result = CreatePetSchema.safeParse({ ...validPet, ownerId: 'abc' });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdatePetSchema', () => {
    it('should accept partial updates', () => {
      const result = UpdatePetSchema.safeParse({ name: 'Bobby' });
      expect(result.success).toBe(true);
    });

    it('should accept null for nullable fields', () => {
      const result = UpdatePetSchema.safeParse({ breed: null });
      expect(result.success).toBe(true);
    });

    it('should accept reproductiveStatus update', () => {
      const result = UpdatePetSchema.safeParse({ reproductiveStatus: 'STERILIZED' });
      expect(result.success).toBe(true);
    });
  });
});

describe('Validations - Appointment Schemas', () => {
  const validAppointment = {
    date: '2024-12-15T10:00:00.000Z',
    reason: 'Vacunación anual',
    categoryId: '550e8400-e29b-41d4-a716-446655440000',
    petId: 1,
    vetId: 2,
    notes: 'Primera visita',
  };

  describe('CreateAppointmentSchema', () => {
    it('should accept valid appointment data', () => {
      const result = CreateAppointmentSchema.safeParse(validAppointment);
      expect(result.success).toBe(true);
    });

    it('should require date', () => {
      const result = CreateAppointmentSchema.safeParse({
        reason: 'Vacunación',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        petId: 1,
      });
      expect(result.success).toBe(false);
    });

    it('should require reason', () => {
      const result = CreateAppointmentSchema.safeParse({
        date: '2024-12-15T10:00:00.000Z',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        petId: 1,
      });
      expect(result.success).toBe(false);
    });

    it('should require valid categoryId (UUID)', () => {
      const result = CreateAppointmentSchema.safeParse({
        ...validAppointment,
        categoryId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should require positive petId', () => {
      const result = CreateAppointmentSchema.safeParse({
        ...validAppointment,
        petId: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional vetId', () => {
      const result = CreateAppointmentSchema.safeParse({
        ...validAppointment,
        vetId: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('should accept PENDING status by default', () => {
      const result = CreateAppointmentSchema.safeParse(validAppointment);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateAppointmentSchema', () => {
    it('should accept partial updates', () => {
      const result = UpdateAppointmentSchema.safeParse({ status: 'CONFIRMED' });
      expect(result.success).toBe(true);
    });

    it('should accept status change to CANCELLED', () => {
      const result = UpdateAppointmentSchema.safeParse({ status: 'CANCELLED' });
      expect(result.success).toBe(true);
    });

    it('should accept date update', () => {
      const result = UpdateAppointmentSchema.safeParse({
        date: '2024-12-20T14:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('should accept null for nullable fields', () => {
      const result = UpdateAppointmentSchema.safeParse({ notes: null });
      expect(result.success).toBe(true);
    });
  });
});

describe('Validations - Medical Record Schemas', () => {
  describe('VitalSignsSchema', () => {
    it('should accept valid vital signs', () => {
      const result = VitalSignsSchema.safeParse({
        weight: 25.5,
        temperature: 38.5,
        heartRate: 80,
        respiratoryRate: 20,
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = VitalSignsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject negative weight', () => {
      const result = VitalSignsSchema.safeParse({ weight: -5 });
      expect(result.success).toBe(false);
    });

    it('should reject negative temperature', () => {
      const result = VitalSignsSchema.safeParse({ temperature: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject negative heartRate', () => {
      const result = VitalSignsSchema.safeParse({ heartRate: -10 });
      expect(result.success).toBe(false);
    });

    it('should reject dehydration percentage over 100', () => {
      const result = VitalSignsSchema.safeParse({ dehydrationPercentage: 150 });
      expect(result.success).toBe(false);
    });

    it('should accept dehydration percentage 0', () => {
      const result = VitalSignsSchema.safeParse({ dehydrationPercentage: 0 });
      expect(result.success).toBe(true);
    });

    it('should accept dehydration percentage 100', () => {
      const result = VitalSignsSchema.safeParse({ dehydrationPercentage: 100 });
      expect(result.success).toBe(true);
    });
  });

  describe('CreateMedicalRecordSchema', () => {
    const validRecord = {
      title: 'Consulta general',
      diagnosis: 'Paciente sano',
      treatment: 'Ninguno',
      publicNotes: 'El paciente se encuentra en buen estado',
      privateNotes: 'Notas privadas del veterinario',
      petId: 1,
    };

    it('should accept valid medical record', () => {
      const result = CreateMedicalRecordSchema.safeParse(validRecord);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const result = CreateMedicalRecordSchema.safeParse({
        publicNotes: 'Notas públicas',
        petId: 1,
      });
      expect(result.success).toBe(false);
    });

    it('should require publicNotes', () => {
      const result = CreateMedicalRecordSchema.safeParse({
        title: 'Consulta',
        petId: 1,
      });
      expect(result.success).toBe(false);
    });

    it('should accept date-only format for date field', () => {
      const result = CreateMedicalRecordSchema.safeParse({
        ...validRecord,
        date: '2023-06-15',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBeInstanceOf(Date);
      }
    });

    it('should accept full ISO datetime for date field', () => {
      const result = CreateMedicalRecordSchema.safeParse({
        ...validRecord,
        date: '2023-06-15T10:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid date string', () => {
      const result = CreateMedicalRecordSchema.safeParse({
        ...validRecord,
        date: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });

    it('should require positive petId', () => {
      const result = CreateMedicalRecordSchema.safeParse({
        title: 'Consulta',
        publicNotes: 'Notas',
        petId: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional vitals', () => {
      const result = CreateMedicalRecordSchema.safeParse({
        ...validRecord,
        vitals: { weight: 25, temperature: 38.5 },
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional date override', () => {
      const result = CreateMedicalRecordSchema.safeParse({
        ...validRecord,
        date: '2024-12-01T10:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateMedicalRecordSchema', () => {
    it('should accept partial updates', () => {
      const result = UpdateMedicalRecordSchema.safeParse({ title: 'Nuevo título' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = UpdateMedicalRecordSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept vitals partial update', () => {
      const result = UpdateMedicalRecordSchema.safeParse({
        vitals: { weight: 26 },
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Validations - Exam Attachment Schema', () => {
  it('should accept valid exam attachment', () => {
    const result = CreateExamAttachmentSchema.safeParse({
      fileName: 'blood_test.pdf',
      fileUrl: 'https://storage.example.com/blood_test.pdf',
      fileType: 'application/pdf',
      description: 'Resultados de análisis de sangre',
    });
    expect(result.success).toBe(true);
  });

  it('should require fileName', () => {
    const result = CreateExamAttachmentSchema.safeParse({
      fileUrl: 'https://example.com/file.pdf',
      fileType: 'application/pdf',
    });
    expect(result.success).toBe(false);
  });

  it('should require valid URL', () => {
    const result = CreateExamAttachmentSchema.safeParse({
      fileName: 'file.pdf',
      fileUrl: 'not-a-url',
      fileType: 'application/pdf',
    });
    expect(result.success).toBe(false);
  });

  it('should require fileType', () => {
    const result = CreateExamAttachmentSchema.safeParse({
      fileName: 'file.pdf',
      fileUrl: 'https://example.com/file.pdf',
    });
    expect(result.success).toBe(false);
  });
});

describe('Validations - Category Schemas', () => {
  describe('CreateCategorySchema', () => {
    it('should accept valid category', () => {
      const result = CreateCategorySchema.safeParse({
        name: 'Vacunación',
        color: '#FF5733',
      });
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const result = CreateCategorySchema.safeParse({ color: '#FF5733' });
      expect(result.success).toBe(false);
    });

    it('should require color', () => {
      const result = CreateCategorySchema.safeParse({ name: 'Vacunación' });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateCategorySchema', () => {
    it('should accept partial updates', () => {
      const result = UpdateCategorySchema.safeParse({ name: 'Nueva categoría' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = UpdateCategorySchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

describe('Validations - Vaccination Schema', () => {
  const validVaccination = {
    vaccineName: 'Óctuple',
    vaccineType: ' Viral',
    administrationDate: '2024-06-15T10:00:00.000Z',
    nextDoseDate: '2025-06-15T10:00:00.000Z',
    lotNumber: 'LOT123456',
    manufacturer: 'Lab Veterinary',
    veterinarian: 'Dr. Smith',
  };

  it('should accept valid vaccination', () => {
    const result = CreateVaccinationSchema.safeParse(validVaccination);
    expect(result.success).toBe(true);
  });

  it('should require vaccineName', () => {
    const result = CreateVaccinationSchema.safeParse({
      vaccineType: 'Viral',
    });
    expect(result.success).toBe(false);
  });

  it('should require vaccineType', () => {
    const result = CreateVaccinationSchema.safeParse({
      vaccineName: 'Óctuple',
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional dates', () => {
    const result = CreateVaccinationSchema.safeParse({
      vaccineName: 'Óctuple',
      vaccineType: 'Viral',
    });
    expect(result.success).toBe(true);
  });

  it('should accept null nextDoseDate', () => {
    const result = CreateVaccinationSchema.safeParse({
      ...validVaccination,
      nextDoseDate: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept date-only format for administrationDate and nextDoseDate', () => {
    const result = CreateVaccinationSchema.safeParse({
      ...validVaccination,
      administrationDate: '2024-01-15',
      nextDoseDate: '2025-01-15',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.administrationDate).toBeInstanceOf(Date);
      expect(result.data.nextDoseDate).toBeInstanceOf(Date);
    }
  });
});

describe('Validations - Deworming Schema', () => {
  const validDeworming = {
    productName: 'Drontal',
    type: 'BOTH' as const,
    dosage: '1 tableta',
    date: '2024-06-15T10:00:00.000Z',
    nextDate: '2024-12-15T10:00:00.000Z',
  };

  it('should accept date-only format for date and nextDate', () => {
    const result = CreateDewormingSchema.safeParse({
      ...validDeworming,
      date: '2024-06-15',
      nextDate: '2024-12-15',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date);
      expect(result.data.nextDate).toBeInstanceOf(Date);
    }
  });

  it('should accept valid deworming', () => {
    const result = CreateDewormingSchema.safeParse(validDeworming);
    expect(result.success).toBe(true);
  });

  it('should require productName', () => {
    const result = CreateDewormingSchema.safeParse({ type: 'INTERNAL' });
    expect(result.success).toBe(false);
  });

  it('should require type', () => {
    const result = CreateDewormingSchema.safeParse({ productName: 'Drontal' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid type', () => {
    const result = CreateDewormingSchema.safeParse({
      productName: 'Drontal',
      type: 'INVALID',
    });
    expect(result.success).toBe(false);
  });

  it('should accept INTERNAL type', () => {
    const result = CreateDewormingSchema.safeParse({
      productName: 'Drontal',
      type: 'INTERNAL',
    });
    expect(result.success).toBe(true);
  });

  it('should accept EXTERNAL type', () => {
    const result = CreateDewormingSchema.safeParse({
      productName: 'Drontal',
      type: 'EXTERNAL',
    });
    expect(result.success).toBe(true);
  });
});

describe('Validations - Surgical History Schema', () => {
  const validSurgical = {
    procedure: 'Castración',
    date: '2023-06-15T10:00:00.000Z',
    complications: 'Ninguna',
    notes: 'Procedimiento sin complicaciones',
    outcomes: 'Recuperación exitosa',
  };

  it('should accept valid surgical history', () => {
    const result = CreateSurgicalHistorySchema.safeParse(validSurgical);
    expect(result.success).toBe(true);
  });

  it('should require procedure', () => {
    const result = CreateSurgicalHistorySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept optional date', () => {
    const result = CreateSurgicalHistorySchema.safeParse({ procedure: 'Cirugía' });
    expect(result.success).toBe(true);
  });

  it('should accept null date', () => {
    const result = CreateSurgicalHistorySchema.safeParse({
      procedure: 'Cirugía',
      date: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept date-only format for date', () => {
    const result = CreateSurgicalHistorySchema.safeParse({
      ...validSurgical,
      date: '2023-06-15',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date);
    }
  });
});

describe('Validations - Chronic Condition Schema', () => {
  const validCondition = {
    name: 'Diabetes',
    type: 'Metabólica',
    severity: 'Moderada',
    diagnosisDate: '2023-01-15T10:00:00.000Z',
    notes: 'Requiere medicación diaria',
    isActive: true,
  };

  it('should accept valid chronic condition', () => {
    const result = CreateChronicConditionSchema.safeParse(validCondition);
    expect(result.success).toBe(true);
  });

  it('should require name', () => {
    const result = CreateChronicConditionSchema.safeParse({ type: 'Alergia' });
    expect(result.success).toBe(false);
  });

  it('should require type', () => {
    const result = CreateChronicConditionSchema.safeParse({ name: 'Alergia' });
    expect(result.success).toBe(false);
  });

  it('should accept isActive false', () => {
    const result = CreateChronicConditionSchema.safeParse({
      ...validCondition,
      isActive: false,
    });
    expect(result.success).toBe(true);
  });

  it('should accept null diagnosisDate', () => {
    const result = CreateChronicConditionSchema.safeParse({
      ...validCondition,
      diagnosisDate: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept date-only format for diagnosisDate', () => {
    const result = CreateChronicConditionSchema.safeParse({
      ...validCondition,
      diagnosisDate: '2024-01-15',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.diagnosisDate).toBeInstanceOf(Date);
    }
  });
});

describe('Validations - Region and Comuna Schemas', () => {
  describe('CreateRegionSchema', () => {
    it('should accept valid region', () => {
      const result = CreateRegionSchema.safeParse({
        code: 'RM',
        name: 'Región Metropolitana',
      });
      expect(result.success).toBe(true);
    });

    it('should require code', () => {
      const result = CreateRegionSchema.safeParse({ name: 'Metropolitana' });
      expect(result.success).toBe(false);
    });

    it('should require name', () => {
      const result = CreateRegionSchema.safeParse({ code: 'RM' });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateComunaSchema', () => {
    it('should accept valid comuna', () => {
      const result = CreateComunaSchema.safeParse({
        code: 'SCL01',
        name: 'Santiago',
        regionId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should require code', () => {
      const result = CreateComunaSchema.safeParse({
        name: 'Santiago',
        regionId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });

    it('should require valid regionId (UUID)', () => {
      const result = CreateComunaSchema.safeParse({
        code: 'SCL01',
        name: 'Santiago',
        regionId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('validateBody Helper', () => {
  it('should return success for valid data', () => {
    const result = validateBody(LoginSchema, {
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('should return error for invalid data', () => {
    const result = validateBody(LoginSchema, { email: 'invalid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('email');
    }
  });

  it('should include field path in error message', () => {
    const result = validateBody(LoginSchema, { email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/email.*inválido/i);
    }
  });
});