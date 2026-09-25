import { Resend } from 'resend';
import { render } from '@react-email/render';
import { AppointmentCreatedEmail } from './templates/appointment-created';
import { AppointmentConfirmedEmail } from './templates/appointment-confirmed';
import { AppointmentCancelledEmail } from './templates/appointment-cancelled';
import { AppointmentCompletedEmail } from './templates/appointment-completed';
import { PasswordResetEmail } from './templates/password-reset';
import { getBranding, ClinicBranding } from '@/services/settings/get-branding';

const resend = new Resend(process.env.RESEND_API_KEY);

const TEST_DOMAIN = 'resend.dev';

interface AppointmentEmailData {
  id: string;
  date: Date;
  reason: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
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
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

interface BrandingLike {
  clinicName: string;
  primaryColor: string;
  footerText: string;
  logoUrl?: string | null;
  fromEmail?: string;
  fromName?: string;
}

function brandingProps(b: ClinicBranding): BrandingLike {
  return {
    clinicName: b.clinicName,
    primaryColor: b.primaryColor,
    footerText: b.footerText,
    logoUrl: b.logoUrl,
  };
}

async function sendEmail({
  to,
  subject,
  html,
  fromEmail,
  fromName,
}: {
  to: string;
  subject: string;
  html: string;
  fromEmail?: string;
  fromName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const isTest = process.env.NODE_ENV !== 'production';

  const from = isTest
    ? `onboarding@${TEST_DOMAIN}`
    : `${fromName || 'VeteriApp'} <${fromEmail || 'noreply@vetriapp.cl'}>`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: isTest ? [to, `delivered@${TEST_DOMAIN}`] : [to],
      subject,
      html,
    });

    if (error) {
      console.error(`[Email] Error sending to ${to}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Sent ${subject} to ${to}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Email] Failed to send to ${to}:`, message);
    return { success: false, error: message };
  }
}

export async function sendAppointmentCreatedEmail(data: AppointmentEmailData) {
  const branding = await getBranding();
  const html = await render(AppointmentCreatedEmail({ ...data, formatDate, branding: brandingProps(branding) }));

  return sendEmail({
    to: data.pet.owner.email,
    subject: `${branding.clinicName}: cita solicitada #${data.id}`,
    html,
    fromEmail: branding.fromEmail,
    fromName: branding.fromName,
  });
}

export async function sendAppointmentConfirmedEmail(data: AppointmentEmailData) {
  const branding = await getBranding();
  const html = await render(AppointmentConfirmedEmail({ ...data, formatDate, branding: brandingProps(branding) }));

  return sendEmail({
    to: data.pet.owner.email,
    subject: `${branding.clinicName}: cita confirmada #${data.id}`,
    html,
    fromEmail: branding.fromEmail,
    fromName: branding.fromName,
  });
}

export async function sendAppointmentCancelledEmail(data: AppointmentEmailData) {
  const branding = await getBranding();
  const html = await render(AppointmentCancelledEmail({ ...data, formatDate, branding: brandingProps(branding) }));

  return sendEmail({
    to: data.pet.owner.email,
    subject: `${branding.clinicName}: cita cancelada #${data.id}`,
    html,
    fromEmail: branding.fromEmail,
    fromName: branding.fromName,
  });
}

export async function sendAppointmentCompletedEmail(data: AppointmentEmailData) {
  const branding = await getBranding();
  const html = await render(AppointmentCompletedEmail({ ...data, formatDate, branding: brandingProps(branding) }));

  return sendEmail({
    to: data.pet.owner.email,
    subject: `${branding.clinicName}: cita completada #${data.id}`,
    html,
    fromEmail: branding.fromEmail,
    fromName: branding.fromName,
  });
}

export async function sendPasswordResetEmail({
  to,
  firstName,
  resetUrl,
  expiresInMinutes = 60,
}: {
  to: string;
  firstName: string;
  resetUrl: string;
  expiresInMinutes?: number;
}): Promise<{ success: boolean; error?: string }> {
  const branding = await getBranding();
  const html = await render(
    PasswordResetEmail({ firstName, resetUrl, expiresInMinutes, branding: brandingProps(branding) })
  );

  return sendEmail({
    to,
    subject: `${branding.clinicName}: restablece tu contraseña`,
    html,
    fromEmail: branding.fromEmail,
    fromName: branding.fromName,
  });
}
