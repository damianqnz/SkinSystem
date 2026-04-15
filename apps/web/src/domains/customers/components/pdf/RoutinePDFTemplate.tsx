/**
 * RoutinePDFTemplate — react-pdf luxury medical prescription.
 *
 * Design tokens (DESIGN_SYSTEM.md):
 *   Cream #FAFAF9 · Stone #1C1917 · Gold #D4AF37 · Muted #78716C · Border #E7E5E4
 *
 * Fonts registered at top level (browser-safe — only used inside PDFDownloadLink ssr:false).
 * Cormorant Garamond: headings (WOFF2 from /fonts/)
 * Outfit: body/labels (WOFF2 from /fonts/)
 *
 * NOTE: Import this file ONLY via dynamic() with { ssr: false } in a Client Component.
 */

import { Document, Page, View, Text, StyleSheet, Font, Line, Svg } from '@react-pdf/renderer';
import type { RoutineStep } from '../../service-routines';

// ── Font registration ─────────────────────────────────────────
// Fonts served from /public/fonts — available at /fonts/ on the client
Font.register({
  family: 'Cormorant',
  fonts: [
    { src: '/fonts/CormorantGaramond-Regular.woff2', fontWeight: 400 },
    { src: '/fonts/CormorantGaramond-Light.woff2',   fontWeight: 300 },
  ],
});

Font.register({
  family: 'Outfit',
  fonts: [{ src: '/fonts/Outfit-Regular.woff2', fontWeight: 400 }],
});

// ── Design tokens ─────────────────────────────────────────────
const CREAM  = '#FAFAF9';
const STONE  = '#1C1917';
const GOLD   = '#D4AF37';
const MUTED  = '#78716C';
const BORDER = '#E7E5E4';

// ── Styles ────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: { backgroundColor: CREAM, paddingVertical: 50, paddingHorizontal: 55, fontFamily: 'Outfit', color: STONE },

  // Header
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  orgName:        { fontFamily: 'Cormorant', fontSize: 22, fontWeight: 300, letterSpacing: 1.2, color: STONE },
  headerRight:    { alignItems: 'flex-end' },
  headerMeta:     { fontSize: 7, color: MUTED, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 },
  goldLine:       { height: 0.75, backgroundColor: GOLD, marginVertical: 12 },

  // Patient block
  patientRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  patientLabel:   { fontSize: 7, color: MUTED, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  patientName:    { fontFamily: 'Cormorant', fontSize: 16, fontWeight: 400, color: STONE, letterSpacing: 0.4 },
  dateValue:      { fontSize: 9, color: MUTED, marginTop: 3 },

  // Section
  section:        { marginBottom: 22 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle:   { fontFamily: 'Cormorant', fontSize: 13, fontWeight: 400, letterSpacing: 1.5, textTransform: 'uppercase', color: STONE, marginRight: 10 },
  sectionLine:    { flex: 1, height: 0.5, backgroundColor: BORDER },

  // Steps
  step:           { flexDirection: 'row', marginBottom: 7, paddingLeft: 4 },
  stepNumber:     { fontSize: 8, color: GOLD, fontWeight: 400, width: 16, marginTop: 1 },
  stepBody:       { flex: 1 },
  stepProduct:    { fontSize: 9, color: STONE, letterSpacing: 0.3, marginBottom: 2 },
  stepInstruction:{ fontSize: 8, color: MUTED, lineHeight: 1.5 },

  // Notes
  notesBox:       { borderLeftWidth: 2, borderLeftColor: GOLD, paddingLeft: 10, marginTop: 4, marginBottom: 22 },
  notesLabel:     { fontSize: 7, color: MUTED, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  notesText:      { fontSize: 8.5, color: STONE, lineHeight: 1.6 },

  // Footer
  footer:         { position: 'absolute', bottom: 30, left: 55, right: 55 },
  footerLine:     { height: 0.5, backgroundColor: BORDER, marginBottom: 8 },
  footerRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  footerText:     { fontSize: 7, color: MUTED, letterSpacing: 0.6 },
  footerBrand:    { fontSize: 7, color: GOLD, letterSpacing: 0.8, textTransform: 'uppercase' },
});

// ── Translations ──────────────────────────────────────────────
const L = {
  es: { title: 'Rutina Home Care', morning: 'Mañana', afternoon: 'Tarde', night: 'Noche', patient: 'Paciente', specialist: 'Especialista', date: 'Fecha de prescripción', notes: 'Notas del especialista', brand: 'SkinSystem · Plataforma Estética' },
  pt: { title: 'Rotina Home Care', morning: 'Manhã', afternoon: 'Tarde', night: 'Noite', patient: 'Paciente', specialist: 'Especialista', date: 'Data da prescrição', notes: 'Notas do especialista', brand: 'SkinSystem · Plataforma Estética' },
  en: { title: 'Home Care Routine', morning: 'Morning', afternoon: 'Afternoon', night: 'Night', patient: 'Patient', specialist: 'Specialist', date: 'Prescription date', notes: 'Specialist notes', brand: 'SkinSystem · Aesthetic Platform' },
} as const;

// ── Sub-components ────────────────────────────────────────────
function SectionBlock({ title, steps }: { title: string; steps: RoutineStep[] }) {
  if (steps.length === 0) return null;
  return (
    <View style={S.section}>
      <View style={S.sectionHeader}>
        <Text style={S.sectionTitle}>{title}</Text>
        <View style={S.sectionLine} />
      </View>
      {steps.map((s, i) => (
        <View key={i} style={S.step}>
          <Text style={S.stepNumber}>{String(i + 1).padStart(2, '0')}.</Text>
          <View style={S.stepBody}>
            <Text style={S.stepProduct}>{s.productName}</Text>
            <Text style={S.stepInstruction}>{s.instruction}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Document ──────────────────────────────────────────────────
export interface RoutinePDFData {
  organizationName: string;
  customerName:     string;
  specialistName:   string;
  generatedAt:      string; // ISO
  locale:           'es' | 'pt' | 'en';
  morningSteps:     RoutineStep[];
  afternoonSteps:   RoutineStep[];
  nightSteps:       RoutineStep[];
  specialistNotes?: string;
}

export function RoutinePDFTemplate({ data }: { data: RoutinePDFData }) {
  const l   = L[data.locale];
  const tag = data.locale === 'pt' ? 'pt-PT' : data.locale === 'en' ? 'en-GB' : 'es-ES';
  const dateStr = new Date(data.generatedAt).toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Document title={l.title} author={data.specialistName} creator="SkinSystem">
      <Page size="A4" style={S.page}>

        {/* ── Header ──────────────────────────────── */}
        <View style={S.headerRow}>
          <Text style={S.orgName}>{data.organizationName}</Text>
          <View style={S.headerRight}>
            <Text style={[S.headerMeta, { color: GOLD }]}>{l.title}</Text>
            <Text style={S.headerMeta}>{data.specialistName}</Text>
          </View>
        </View>
        <View style={S.goldLine} />

        {/* ── Patient ─────────────────────────────── */}
        <View style={S.patientRow}>
          <View>
            <Text style={S.patientLabel}>{l.patient}</Text>
            <Text style={S.patientName}>{data.customerName}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={S.patientLabel}>{l.date}</Text>
            <Text style={S.dateValue}>{dateStr}</Text>
          </View>
        </View>

        {/* ── Routine sections ────────────────────── */}
        <SectionBlock title={l.morning}   steps={data.morningSteps}   />
        <SectionBlock title={l.afternoon} steps={data.afternoonSteps} />
        <SectionBlock title={l.night}     steps={data.nightSteps}     />

        {/* ── Specialist notes ────────────────────── */}
        {data.specialistNotes && (
          <View style={S.notesBox}>
            <Text style={S.notesLabel}>{l.notes}</Text>
            <Text style={S.notesText}>{data.specialistNotes}</Text>
          </View>
        )}

        {/* ── Footer ──────────────────────────────── */}
        <View style={S.footer} fixed>
          <View style={S.footerLine} />
          <View style={S.footerRow}>
            <Text style={S.footerText}>{data.organizationName} · {data.customerName}</Text>
            <Text style={S.footerBrand}>{l.brand}</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
