import { Text, Section, Hr } from '@react-email/components';
import { BaseLayout } from './base.layout';

interface AppointmentCreatedEmailProps {
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

export function AppointmentCreatedEmail({ id, pet, date, category, formatDate, branding }: AppointmentCreatedEmailProps) {
  return (
    <BaseLayout title="Cita Solicitada" branding={branding}>
      <Text style={{ fontSize: '18px', color: '#374151', margin: '0 0 24px 0' }}>
        Hola <strong>{pet.owner.firstName}</strong>,
      </Text>

      <Text style={{ fontSize: '16px', color: '#374151', margin: '0 0 24px 0' }}>
        Hemos recibido la solicitud de cita para su mascota <strong>{pet.name}</strong>.
      </Text>

      <Section style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
        <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Fecha solicitada</Text>
        <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151', margin: '0 0 16px 0' }}>
          {formatDate(date)}
        </Text>

        <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Categoría</Text>
        <Text style={{ fontSize: '16px', color: '#374151', margin: 0 }}>
          {category.name}
        </Text>
      </Section>

      <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>
        Su cita está pendiente de confirmación. Le notificaremos por email cuando un miembro de nuestro staff confirme su cita.
      </Text>

      <Hr style={{ borderColor: '#e5e7eb', margin: '0 0 24px 0' }} />

      <Text style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
        Nº de cita: <strong>#{id}</strong>
      </Text>
    </BaseLayout>
  );
}