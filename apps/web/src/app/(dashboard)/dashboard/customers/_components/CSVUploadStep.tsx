'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { importCustomersAction } from '../actions/import-customers';

interface Props { locale: string; onBack: () => void; onClose: () => void; }
type ParsedRow = { fullName: string; email?: string; phone?: string };
type Step = 'idle' | 'preview' | 'loading' | 'done';

const MAX_BYTES = 3 * 1024 * 1024;

function findCol(headers: string[], ...keys: string[]): number {
  return headers.findIndex(h => keys.some(k => h.toLowerCase().trim().includes(k)));
}

function parseRows(data: string[][]): ParsedRow[] {
  const [head = [], ...body] = data;
  const ni = findCol(head, 'nombre', 'name', 'fullname', 'nome');
  const ei = findCol(head, 'email', 'correo', 'mail');
  const pi = findCol(head, 'telefono', 'phone', 'tel', 'telefone');
  return body.flatMap(row => {
    const fullName = ni >= 0 ? row[ni]?.trim() : row[0]?.trim();
    if (!fullName || fullName.length < 2) return [];
    return [{ fullName, email: ei >= 0 ? row[ei]?.trim() || undefined : undefined, phone: pi >= 0 ? row[pi]?.trim() || undefined : undefined }];
  });
}

export function CSVUploadStep({ locale, onBack, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step,   setStep]   = useState<Step>('idle');
  const [rows,   setRows]   = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [fmtErr, setFmtErr] = useState('');
  const [drag,   setDrag]   = useState(false);

  const t = {
    drop:     locale === 'pt' ? 'Arraste o CSV aqui ou clique para selecionar' : locale === 'en' ? 'Drag CSV here or click to browse' : 'Arrastra el CSV aquí o haz clic para seleccionar',
    sizeErr:  locale === 'pt' ? 'O ficheiro excede 3 MB' : locale === 'en' ? 'File exceeds 3 MB' : 'El archivo supera 3 MB',
    typeErr:  'Solo se aceptan archivos .csv',
    preview:  locale === 'pt' ? 'Pré-visualização — primeiras 5 filas' : locale === 'en' ? 'Preview — first 5 rows' : 'Vista previa — primeras 5 filas',
    loading:  locale === 'pt' ? 'Importando...' : locale === 'en' ? 'Importing...' : 'Importando...',
    back:     locale === 'pt' ? 'Voltar' : locale === 'en' ? 'Back' : 'Volver',
    close:    locale === 'pt' ? 'Fechar' : locale === 'en' ? 'Close' : 'Cerrar',
    name:     locale === 'en' ? 'Name'  : 'Nombre',
    imported: locale === 'en' ? 'clients imported' : locale === 'pt' ? 'clientes importados' : 'clientes importados',
    skipped:  locale === 'en' ? 'skipped' : locale === 'pt' ? 'ignorados' : 'omitidos',
  };

  function processFile(file: File) {
    setFmtErr('');
    if (!file.name.toLowerCase().endsWith('.csv')) { setFmtErr(t.typeErr); return; }
    if (file.size > MAX_BYTES) { setFmtErr(t.sizeErr); return; }
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: ({ data }) => { setRows(parseRows(data)); setStep('preview'); },
    });
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  async function handleImport() {
    setStep('loading');
    const res = await importCustomersAction({ rows });
    if (res.error) { toast.error(res.error.message); setStep('preview'); return; }
    const d = res.data!;
    setResult(d);
    setStep('done');
    toast.success(`${d.imported} ${t.imported}`);
  }

  const btn = 'w-full py-2.5 rounded-sm font-sans text-sm transition-colors';

  if (step === 'done') return (
    <div className="text-center py-6 space-y-4">
      <CheckCircle2 className="mx-auto text-emerald-500" size={40} strokeWidth={1.5} />
      <p className="font-sans text-sm text-stone-700">
        {result!.imported} {t.imported}
        {result!.skipped > 0 && <span className="text-amber-600"> · {result!.skipped} {t.skipped}</span>}
      </p>
      <button onClick={onClose} className={`${btn} bg-stone-900 text-white hover:bg-stone-800`}>{t.close}</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 font-sans text-sm transition-colors">
        <ArrowLeft size={13} strokeWidth={1.5} /> {t.back}
      </button>

      {step === 'idle' && (
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={onDrop} onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-colors ${drag ? 'border-[#D4AF37] bg-amber-50/60' : 'border-stone-200 hover:border-stone-300'}`}>
          <Upload size={26} strokeWidth={1.5} className="mx-auto text-stone-300 mb-3" />
          <p className="font-sans text-sm text-stone-500">{t.drop}</p>
          {fmtErr && <p className="font-sans text-xs text-red-500 mt-2">{fmtErr}</p>}
          <input ref={inputRef} type="file" accept=".csv" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
        </div>
      )}

      {step === 'preview' && rows.length > 0 && (
        <>
          <p className="font-sans text-[11px] text-stone-400 uppercase tracking-wider">{t.preview} · {rows.length} total</p>
          <div className="overflow-x-auto rounded-sm border border-stone-100">
            <table className="w-full font-sans text-xs">
              <thead><tr className="bg-stone-50 border-b border-stone-100">
                {[t.name, 'Email', locale === 'en' ? 'Phone' : 'Teléfono'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-stone-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>{rows.slice(0, 5).map((r, i) => (
                <tr key={i} className="border-b border-stone-50 last:border-0">
                  <td className="px-3 py-2 text-stone-700 max-w-[120px] truncate">{r.fullName}</td>
                  <td className="px-3 py-2 text-stone-500 max-w-[120px] truncate">{r.email ?? '—'}</td>
                  <td className="px-3 py-2 text-stone-500">{r.phone ?? '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <button onClick={handleImport} className={`${btn} bg-stone-900 text-white hover:bg-stone-800`}>
            {locale === 'en' ? `Import ${rows.length} clients` : `Importar ${rows.length} clientes`}
          </button>
        </>
      )}

      {step === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-10 font-sans text-sm text-stone-500">
          <span className="inline-block animate-spin">↻</span> {t.loading}
        </div>
      )}
    </div>
  );
}
