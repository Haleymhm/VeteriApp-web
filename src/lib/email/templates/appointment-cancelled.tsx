import { Text, Section, Hr } from '@react-email/components';
import { BaseLayout } from './base.layout';

interface AppointmentCancelledEmailProps {
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

export function AppointmentCancelledEmail({ id, pet, date, category, formatDate, branding }: AppointmentCancelledEmailProps) {
  return (
    <BaseLayout title="Cita Cancelada" branding={branding}>
      <Text style={{ fontSize: '18px', color: '#374151', margin: '0 0 24px 0' }}>
        Hola <strong>{pet.owner.firstName}</strong>,
      </Text>

      <Text style={{ fontSize: '16px', color: '#374151', margin: '0 0 24px 0' }}>
        La cita programada para su mascota <strong>{pet.name}</strong> ha sido cancelada.
      </Text>

      <Section style={{ backgroundColor: '#fef2f2', borderRadius: '8px', padding: '20px', marginBottom: '24px', borderLeft: '4px solid #ef4444' }}>
        <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Fecha de la cita cancelada</Text>
        <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151', margin: '0 0 16px 0' }}>
          {formatDate(date)}
        </Text>

        <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Categoría</Text>
        <Text style={{ fontSize: '16px', color: '#374151', margin: 0 }}>
          {category.name}
        </Text>
      </Section>

      <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>
        Si desea reprogramar su cita, puede hacerlo a través de nuestro portal de clientes en cualquier momento.
      </Text>

      <Hr style={{ borderColor: '#e5e7eb', margin: '0 0 24px 0' }} />

      <Text style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
        Nº de cita: <strong>#{id}</strong>
      </Text>
    </BaseLayout>
  );
}