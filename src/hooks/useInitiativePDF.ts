import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { fetchInitiativeExportData, InitiativeExportData } from './useInitiativeExport';
import { automationKnowledgeBaseSections } from '@/data/automationKnowledgeBaseTemplates';
import { PHASE_SOP_CONFIGS } from '@/data/automationPhaseSOPs';
import { AUTOMATION_STEPS } from '@/hooks/useInitiatives';

const COLORS = {
  bg: '#0a0a0a',
  cardBg: '#141414',
  primary: '#f2f2f2',
  secondary: '#7a7a7a',
  accent: '#3b82f6',
  green: '#22c55e',
  border: '#222222',
  muted: '#404040',
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  mvp: 'MVP',
  funnel: 'Funnel',
  app: 'App',
  automation: 'Automatización & IA',
  landing_page: 'Landing Page',
};

function addPage(doc: jsPDF): number {
  doc.addPage();
  // Background
  doc.setFillColor(COLORS.bg);
  doc.rect(0, 0, 210, 297, 'F');
  return 20;
}

function drawHeader(doc: jsPDF, data: InitiativeExportData): number {
  let y = 20;
  
  // Background
  doc.setFillColor(COLORS.bg);
  doc.rect(0, 0, 210, 297, 'F');
  
  // Top accent line
  doc.setFillColor(COLORS.accent);
  doc.rect(0, 0, 210, 3, 'F');
  
  // Logo area
  doc.setFillColor(COLORS.cardBg);
  doc.roundedRect(15, y, 180, 50, 3, 3, 'F');
  
  // Project name (small)
  doc.setTextColor(COLORS.secondary);
  doc.setFontSize(10);
  doc.text(data.project.name.toUpperCase(), 25, y + 15);
  
  // Initiative name (large)
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const name = data.initiative.name;
  doc.text(name, 25, y + 30);
  
  // Badge
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const badgeText = PRODUCT_TYPE_LABELS[data.initiative.product_type] || data.initiative.product_type;
  const badgeWidth = doc.getTextWidth(badgeText) + 12;
  doc.setFillColor(COLORS.accent);
  doc.roundedRect(25, y + 35, badgeWidth, 8, 2, 2, 'F');
  doc.setTextColor('#ffffff');
  doc.text(badgeText, 31, y + 40.5);
  
  y += 60;
  
  // Meta info
  doc.setFillColor(COLORS.cardBg);
  doc.roundedRect(15, y, 180, 20, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(COLORS.secondary);
  doc.text('Estado', 25, y + 8);
  doc.text('Fase actual', 80, y + 8);
  doc.text('Fecha', 140, y + 8);
  
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.initiative.status, 25, y + 15);
  doc.text(data.initiative.current_step, 80, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' }), 140, y + 15);
  
  y += 28;
  return y;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  if (y > 260) y = addPage(doc);
  
  // Accent bar
  doc.setFillColor(COLORS.accent);
  doc.rect(15, y, 3, 10, 'F');
  
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 22, y + 8);
  doc.setFont('helvetica', 'normal');
  
  return y + 16;
}

function drawFieldLabel(doc: jsPDF, label: string, y: number): number {
  if (y > 275) y = addPage(doc);
  doc.setTextColor(COLORS.secondary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(label.toUpperCase(), 20, y);
  doc.setFont('helvetica', 'normal');
  return y + 5;
}

function drawFieldValue(doc: jsPDF, value: string, y: number, maxWidth = 170): number {
  if (y > 275) y = addPage(doc);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(value, maxWidth);
  for (const line of lines) {
    if (y > 285) y = addPage(doc);
    doc.text(line, 20, y);
    y += 4.5;
  }
  return y + 2;
}

function drawDivider(doc: jsPDF, y: number): number {
  if (y > 280) y = addPage(doc);
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(15, y, 195, y);
  return y + 6;
}

function generateAutomationPDF(doc: jsPDF, data: InitiativeExportData): void {
  let y = drawHeader(doc, data);
  const kb = data.knowledgeBase || {};

  // KB Sections
  for (const section of automationKnowledgeBaseSections) {
    const sectionData = kb[section.key];
    y = drawSectionTitle(doc, section.title, y);
    
    if (!sectionData || Object.keys(sectionData).length === 0) {
      doc.setTextColor(COLORS.muted);
      doc.setFontSize(9);
      doc.text('Sin completar', 20, y);
      y += 8;
      y = drawDivider(doc, y);
      continue;
    }

    for (const field of section.fields) {
      const val = sectionData[field.key];
      if (val === undefined || val === null || val === '') continue;

      y = drawFieldLabel(doc, field.label, y);

      if (field.type === 'repeater' && Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          const item = val[i] as Record<string, any>;
          const parts = Object.entries(item).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ');
          y = drawFieldValue(doc, `${i + 1}. ${parts}`, y);
        }
      } else if (Array.isArray(val)) {
        y = drawFieldValue(doc, val.join(', '), y);
      } else if (typeof val === 'boolean') {
        y = drawFieldValue(doc, val ? 'Sí' : 'No', y);
      } else {
        y = drawFieldValue(doc, String(val), y);
      }
    }
    y = drawDivider(doc, y);
  }

  // Phase Progress
  y = drawSectionTitle(doc, 'Progreso por Fase', y);
  for (const step of AUTOMATION_STEPS) {
    if (y > 265) y = addPage(doc);
    const sopConfig = PHASE_SOP_CONFIGS[step.step];
    if (!sopConfig) continue;
    
    const checklist = data.phaseChecklists?.[step.step] || [];
    const completed = sopConfig.checklist.filter((_, i) => !!checklist[i]).length;
    const total = sopConfig.checklist.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    doc.setTextColor(COLORS.primary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(sopConfig.title, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.secondary);
    doc.setFontSize(8);
    doc.text(`${completed}/${total} (${pct}%)`, 170, y);
    y += 6;

    // Progress bar
    doc.setFillColor(COLORS.border);
    doc.roundedRect(20, y, 150, 3, 1, 1, 'F');
    if (pct > 0) {
      doc.setFillColor(COLORS.green);
      doc.roundedRect(20, y, 150 * (pct / 100), 3, 1, 1, 'F');
    }
    y += 10;
  }
}

function generateStandardPDF(doc: jsPDF, data: InitiativeExportData): void {
  let y = drawHeader(doc, data);

  // Brief
  if (data.brief) {
    y = drawSectionTitle(doc, 'Brief', y);
    const briefFields: [string, string | null | undefined][] = [
      ['Resumen Ejecutivo', data.brief.executive_summary],
      ['Problema', data.brief.problem_statement],
      ['Usuarios Objetivo', data.brief.target_users],
      ['Solución Propuesta', data.brief.proposed_solution],
      ['Job to be Done', data.brief.job_to_be_done],
      ['Objetivos', data.brief.product_objectives],
      ['Métricas de Éxito', data.brief.success_metrics],
    ];
    for (const [label, value] of briefFields) {
      if (!value) continue;
      y = drawFieldLabel(doc, label, y);
      y = drawFieldValue(doc, value, y);
    }
    y = drawDivider(doc, y);
  }

  // Features
  if (data.features.length > 0) {
    y = drawSectionTitle(doc, 'Features', y);
    for (const feature of data.features) {
      if (y > 270) y = addPage(doc);
      doc.setTextColor(COLORS.primary);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${feature.name}`, 20, y);
      doc.setFont('helvetica', 'normal');
      
      const meta = `${feature.priority.toUpperCase()} · ${feature.complexity}`;
      doc.setTextColor(COLORS.secondary);
      doc.setFontSize(8);
      doc.text(meta, 170, y);
      y += 5;
      
      if (feature.description) {
        y = drawFieldValue(doc, feature.description, y, 160);
      }
      y += 2;
    }
    y = drawDivider(doc, y);
  }

  // Tech Docs
  if (data.techDocs) {
    y = drawSectionTitle(doc, 'Tech Docs', y);
    const techFields: [string, string | null | undefined][] = [
      ['Frontend Guidelines', data.techDocs.frontend_guidelines],
      ['Backend Structure', data.techDocs.backend_structure],
      ['Database Schema', data.techDocs.database_schema],
      ['Authentication', data.techDocs.authentication],
      ['Integrations', data.techDocs.integrations],
      ['Implementation Plan', data.techDocs.implementation_plan],
    ];
    for (const [label, value] of techFields) {
      if (!value) continue;
      y = drawFieldLabel(doc, label, y);
      y = drawFieldValue(doc, value, y);
    }
  }
}

// Footer on all pages
function addFooters(doc: jsPDF, name: string): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(COLORS.cardBg);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setTextColor(COLORS.muted);
    doc.setFontSize(7);
    doc.text('Waves Portal — Documento generado automáticamente', 15, 293);
    doc.text(`${i} / ${pageCount}`, 190, 293);
  }
}

export async function downloadInitiativePDF(initiativeId: string): Promise<void> {
  const data = await fetchInitiativeExportData(initiativeId);
  if (!data) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  if (data.initiative.product_type === 'automation') {
    generateAutomationPDF(doc, data);
  } else {
    generateStandardPDF(doc, data);
  }

  addFooters(doc, data.initiative.name);

  const fileName = `${data.initiative.name.replace(/\s+/g, '_')}_spec.pdf`;
  doc.save(fileName);
  toast.success('PDF descargado');
}
