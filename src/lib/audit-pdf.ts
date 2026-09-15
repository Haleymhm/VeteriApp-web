import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { imageFromUrl } from './pdf/image-from-url';
import { getBranding, hexToRgb, ClinicBranding } from '@/services/settings/get-branding';

interface AuditLogEntry {
  id: string;
  userFullName: string;
  userEmail: string;
  action: string;
  module: string;
  entityId: string;
  entityType: string;
  timestamp: string;
  ipAddress: string | null;
  details: Array<{ fieldName: string; oldValue: string | null; newValue: string | null }>;
}

interface AuditReportData {
  logs: AuditLogEntry[];
  startDate: string;
  endDate: string;
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const actionLabels: Record<string, string> = {
  CREATE: 'Creación',
  READ: 'Lectura',
  UPDATE: 'Edición',
  DELETE: 'Eliminación',
};

export const generateAuditPDF = async (data: AuditReportData): Promise<jsPDF> => {
  const branding: ClinicBranding = await getBranding();
  const primaryRgb = hexToRgb(branding.primaryColor);

  const doc = new jsPDF();

  // Logo en header si existe
  let logoLoaded = false;
  let logoWidth = 0;
  if (branding.logoUrl) {
    const img = await imageFromUrl(branding.logoUrl);
    if (img) {
      try {
        const logoHeight = 14;
        logoWidth = 28;
        doc.addImage(img.dataUrl, img.format, 20, 12, logoWidth, logoHeight);
        logoLoaded = true;
      } catch (err) {
        console.warn('[Audit PDF] No se pudo insertar el logo:', err);
      }
    }
  }

  doc.setFontSize(18);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);

  if (logoLoaded) {
    doc.text('REGISTRO DE AUDITORÍA', 20 + logoWidth + 8, 20, { align: 'left' });
  } else {
    doc.text('REGISTRO DE AUDITORÍA', 105, 20, { align: 'center' });
  }

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  if (logoLoaded) {
    doc.text(branding.clinicName, 20 + logoWidth + 8, 26, { align: 'left' });
  } else {
    doc.text(`${branding.clinicName} - Sistema de Gestión`, 105, 28, { align: 'center' });
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 32, 190, 32);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Período: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`, 20, 40);
  doc.text(`Total registros: ${data.logs.length}`, 20, 46);
  doc.text(`Fecha de generación: ${formatDate(new Date().toISOString())}`, 20, 52);

  const actionCounts = data.logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let yPos = 60;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Resumen de operaciones:', 20, yPos);
  yPos += 6;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  Object.entries(actionCounts).forEach(([action, count]) => {
    doc.text(`  ${actionLabels[action] || action}: ${count}`, 20, yPos);
    yPos += 5;
  });

  yPos += 10;

  if (data.logs.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text('DETALLE DE OPERACIONES', 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Fecha', 'Usuario', 'Acción', 'Módulo', 'Entidad', 'ID Entidad']],
      body: data.logs.map((log) => [
        formatDate(log.timestamp),
        `${log.userFullName}\n${log.userEmail}`,
        actionLabels[log.action] || log.action,
        log.module,
        log.entityType,
        log.entityId,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [primaryRgb.r, primaryRgb.g, primaryRgb.b] },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
      },
    });

     
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  const logsWithChanges = data.logs.filter((log) => log.details && log.details.length > 0);

  if (logsWithChanges.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text('CAMBIOS DE CAMPOS (DETALLE)', 20, yPos);
    yPos += 5;

    logsWithChanges.forEach((log, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPos - 3, 170, 7, 'F');

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `${index + 1}. ${actionLabels[log.action] || log.action} en ${log.entityType}:${log.entityId}`,
        22,
        yPos + 1
      );
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`${formatDate(log.timestamp)} - ${log.userFullName}`, 120, yPos + 1);

      yPos += 8;

      if (log.details.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Campo', 'Valor Anterior', 'Valor Nuevo']],
          body: log.details.map((d) => [
            d.fieldName,
            d.oldValue || '-',
            d.newValue || '-',
          ]),
          theme: 'grid',
          headStyles: { fillColor: [100, 100, 100] },
          styles: { fontSize: 7 },
          margin: { left: 22, right: 20 },
        });

         
        yPos = (doc as any).lastAutoTable.finalY + 8;
      }
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `${branding.footerText} - Generado el ${new Date().toLocaleString('es-CL')}`,
    105,
    290,
    { align: 'center' }
  );

  return doc;
};

export const generateAuditCSV = (data: AuditReportData): string => {
  const headers = [
    'Fecha',
    'Usuario',
    'Email',
    'Acción',
    'Módulo',
    'Tipo Entidad',
    'ID Entidad',
    'IP',
    'Campos Modificados',
  ];

  const rows = data.logs.map((log) => [
    formatDate(log.timestamp),
    log.userFullName,
    log.userEmail,
    actionLabels[log.action] || log.action,
    log.module,
    log.entityType,
    log.entityId,
    log.ipAddress || '-',
    log.details.map((d) => `${d.fieldName}: ${d.oldValue || '-'} → ${d.newValue || '-'}`).join(' | '),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
};
