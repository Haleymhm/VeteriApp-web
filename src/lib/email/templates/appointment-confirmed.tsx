import { Text, Section, Hr } from '@react-email/components';
import { BaseLayout } from './base.layout';

interface AppointmentConfirmedEmailProps {
  id: string;
  date: Date;
  reason: string;
  status: string;
  pet: {
    name: string;
    owner: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  vet: {
    firstName: string;
    lastName: string;
  } | null;
  category: {
    name: string;
    color: string;
  };
  formatDate: (date: Date) => string;
  branding?: {
    clinicName: string;
    primaryColor: string;
    footerText: string;
    logoUrl?: string | null;
  };
}

export function AppointmentConfirmedEmail({ id, pet, date, vet, category, formatDate, branding }: AppointmentConfirmedEmailProps) {
  return (
    <BaseLayout title="Cita Confirmada" branding={branding}>
      <Text style={{ fontSize: '18px', color: '#374151', margin: '0 0 24px 0' }}>
        Hola <strong>{pet.owner.firstName}</strong>,
      </Text>

      <Text style={{ fontSize: '16px', color: '#374151', margin: '0 0 24px 0' }}>
        ¡Buenas noticias! La cita para su mascota <strong>{pet.name}</strong> ha sido confirmada.
      </Text>

      <Section style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '20px', marginBottom: '24px', borderLeft: '4px solid #22c55e' }}>
        <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Fecha y hora</Text>
        <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', margin: '0 0 16px 0' }}>
          {formatDate(date)}
        </Text>

        {vet && (
          <>
            <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Veterinario</Text>
            <Text style={{ fontSize: '16px', color: '#374151', margin: '0 0 16px 0' }}>
              Dr. {vet.firstName} {vet.lastName}
            </Text>
          </>
        )}

        <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Categoría</Text>
        <Text style={{ fontSize: '16px', color: '#374151', margin: 0 }}>
          {category.name}
        </Text>
      </Section>

      <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>
        Por favor, arrive 10 minutos antes de su cita. Si necesita cancelar o reprogramar, contáctenos con anticipación.
      </Text>

      <Hr style={{ borderColor: '#e5e7eb', margin: '0 0 24px 0' }} />

      <Text style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
        Nº de cita: <strong>#{id}</strong>
      </Text>
    </BaseLayout>
  );
}