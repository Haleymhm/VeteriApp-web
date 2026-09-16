import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { imageFromUrl } from "./pdf/image-from-url";
import { getBranding, hexToRgb, ClinicBranding } from "@/services/settings/get-branding";

interface PetInfo {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weight: number | null;
  sex: string | null;
  owner: { firstName: string; lastName: string; email: string };
}

interface Vaccination {
  vaccineName: string;
  vaccineType: string;
  administrationDate: string;
  nextDoseDate: string | null;
  lotNumber: string | null;
  manufacturer: string | null;
}

interface Deworming {
  productName: string;
  type: string;
  date: string;
  nextDate: string | null;
  dosage: string | null;
}

interface SurgicalHistory {
  procedure: string;
  date: string | null;
  complications: string | null;
  notes: string | null;
}

interface ChronicCondition {
  name: string;
  type: string;
  severity: string | null;
  diagnosisDate: string | null;
  notes: string | null;
  isActive: boolean;
}

interface MedicalRecord {
  id: number;
  date: string;
  title: string;
  diagnosis: string | null;
  treatment: string | null;
  publicNotes: string;
  vet: { firstName: string; lastName: string };
  vitals: {
    weight: number | null;
    temperature: number | null;
    heartRate: number | null;
    respiratoryRate: number | null;
  } | null;
}

interface MedicalHistoryPDFData {
  pet: PetInfo;
  vaccinations: Vaccination[];
  deworming: Deworming[];
  surgicalHistory: SurgicalHistory[];
  chronicConditions: ChronicCondition[];
  medicalRecords: MedicalRecord[];
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const dewormingTypeLabels: Record<string, string> = {
  INTERNAL: "Interno",
  EXTERNAL: "Externo",
  BOTH: "Ambos",
};

export const generateMedicalHistoryPDF = async (data: MedicalHistoryPDFData): Promise<void> => {
  const branding: ClinicBranding = await getBranding();
  const primaryRgb = hexToRgb(branding.primaryColor);

  const doc = new jsPDF();

  // Header: intentar cargar logo si existe; fallback a texto
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
        console.warn('[PDF] No se pudo insertar el logo:', err);
      }
    }
  }

  // Title (ajustar posición si logo está presente)
  const titleX = logoLoaded ? 20 + logoWidth + 8 : 105;
  const titleAlign: "left" | "center" = logoLoaded ? "left" : "center";

  doc.setFontSize(18);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text("HISTORIAL MÉDICO", titleX, 20, { align: titleAlign });

  if (logoLoaded) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(branding.clinicName, titleX, 26, { align: titleAlign });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${branding.clinicName} - Historial Clínico`, 105, 28, { align: "center" });
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 32, 190, 32);

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Paciente: ${data.pet.name}`, 20, 45);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  const petInfo = [
    `Especie: ${data.pet.species}`,
    data.pet.breed ? `Raza: ${data.pet.breed}` : null,
    data.pet.birthDate ? `Fecha de Nacimiento: ${formatDate(data.pet.birthDate)}` : null,
    data.pet.sex ? `Sexo: ${data.pet.sex === "MALE" ? "Macho" : "Hembra"}` : null,
    data.pet.weight ? `Peso: ${data.pet.weight} kg` : null,
  ].filter(Boolean);

  let yPos = 52;
  petInfo.forEach((info) => {
    if (info) {
      doc.text(info, 20, yPos);
      yPos += 6;
    }
  });

  yPos += 4;
  doc.text(`Propietario: ${data.pet.owner.firstName} ${data.pet.owner.lastName}`, 20, yPos);
  yPos += 6;
  doc.text(`Email: ${data.pet.owner.email}`, 20, yPos);
  yPos += 6;
  doc.text(`Fecha de generación: ${formatDate(new Date().toISOString())}`, 20, yPos);

  yPos += 15;

  if (data.vaccinations.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text("VACUNAS", 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Vacuna", "Tipo", "Fecha", "Próxima Dosis", "Lote", "Fabricante"]],
      body: data.vaccinations.map((v) => [
        v.vaccineName,
        v.vaccineType,
        formatDate(v.administrationDate),
        formatDate(v.nextDoseDate),
        v.lotNumber || "-",
        v.manufacturer || "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [primaryRgb.r, primaryRgb.g, primaryRgb.b] },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
    });

     
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  if (data.deworming.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text("DESPARASITACIONES", 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Producto", "Tipo", "Fecha", "Próxima", "Dosis"]],
      body: data.deworming.map((d) => [
        d.productName,
        dewormingTypeLabels[d.type] || d.type,
        formatDate(d.date),
        formatDate(d.nextDate),
        d.dosage || "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [primaryRgb.r, primaryRgb.g, primaryRgb.b] },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
    });

     
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  if (data.surgicalHistory.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text("ANTECEDENTES QUIRÚRGICOS", 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Procedimiento", "Fecha", "Complicaciones", "Notas"]],
      body: data.surgicalHistory.map((s) => [
        s.procedure,
        formatDate(s.date),
        s.complications || "-",
        s.notes || "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [primaryRgb.r, primaryRgb.g, primaryRgb.b] },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
    });

     
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  if (data.chronicConditions.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text("ALERGIAS / PATOLOGÍAS CRÓNICAS", 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Nombre", "Tipo", "Severidad", "Fecha Diagnóstico", "Estado", "Notas"]],
      body: data.chronicConditions.map((c) => [
        c.name,
        c.type,
        c.severity || "-",
        formatDate(c.diagnosisDate),
        c.isActive ? "Activa" : "Inactiva",
        c.notes || "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [primaryRgb.r, primaryRgb.g, primaryRgb.b] },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
    });

     
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  if (data.medicalRecords.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text("CONSULTAS MÉDICAS", 20, yPos);
    yPos += 5;

    data.medicalRecords.forEach((record, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPos - 3, 170, 8, "F");

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`${index + 1}. ${record.title}`, 22, yPos + 2);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`${formatDate(record.date)} - Dr. ${record.vet.firstName} ${record.vet.lastName}`, 140, yPos + 2);

      yPos += 10;

      if (record.vitals) {
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        const vitalsText = [
          record.vitals.weight ? `Peso: ${record.vitals.weight} kg` : null,
          record.vitals.temperature ? `Temp: ${record.vitals.temperature} °C` : null,
          record.vitals.heartRate ? `FC: ${record.vitals.heartRate} lpm` : null,
          record.vitals.respiratoryRate ? `FR: ${record.vitals.respiratoryRate} rpm` : null,
        ]
          .filter(Boolean)
          .join(" | ");

        if (vitalsText) {
          doc.text(vitalsText, 22, yPos);
          yPos += 5;
        }
      }

      if (record.diagnosis) {
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(`Diagnóstico: ${record.diagnosis}`, 22, yPos);
        yPos += 5;
      }

      if (record.treatment) {
        doc.setFontSize(8);
        doc.text(`Tratamiento: ${record.treatment}`, 22, yPos);
        yPos += 5;
      }

      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const splitNotes = doc.splitTextToSize(`Notas: ${record.publicNotes}`, 165);
      doc.text(splitNotes, 22, yPos);
      yPos += splitNotes.length * 4 + 5;
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `${branding.footerText} - Documento generado el ${new Date().toLocaleString("es-CL")}`,
    105,
    290,
    { align: "center" }
  );

  doc.save(`historial-medico-${data.pet.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
};
