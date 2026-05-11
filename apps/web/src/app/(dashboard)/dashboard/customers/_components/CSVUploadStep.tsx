'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
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

export function CSVUploadStep({ onBack, onClose }: Props) {
  const tImport = useTranslations('customers.import');
  const tCsv    = useTranslations('dashboard.customers.csv');
  const inputRef = useRef<HTMLInputElement>(null);
  const [step,   setStep]   = useState<Step>('idle');
  const [rows,   setRows]   = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [fmtErr, setFmtErr] = useState('');
  const [drag,   setDrag]   = useState(false);

  function processFile(file: File) {
    setFmtErr('');
    if (!file.name.toLowerCase().endsWith('.csv')) { setFmtErr(tCsv('typeErr')); return; }
    if (file.size > MAX_BYTES) { setFmtErr(tImport('sizeError')); return; }
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: ({ data }) => { setRows(parseRows(data)); setStep('preview'); },
    });
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleImport() {
    setStep('loading');
    const res = await importCustomersAction({ rows });
    if (res.error) { toast.error(res.error.message); setStep('preview'); return; }
    const d = res.data!;
    setResult(d);
    setStep('done');
    toast.success(tImport('success', { count: d.imported }));
  }

  const btn = 'w-full py-2.5 rounded-sm font-sans text-sm transition-colors';

  if (step === 'done') return (
    <div className="text-center py-6 space-y-4">
      <CheckCircle2 className="mx-auto text-emerald-500" size={40} strokeWidth={1.5} />
      <p className="font-sans text-sm text-stone-700">
        {tImport('success', { count: result!.imported })}
        {result!.skipped > 0 && (
          <span className="text-amber-600"> · {tImport('partial', { imported: 0, skipped: result!.skipped }).split(',')[1]}</span>
        )}
      </p>
      <button onClick={onClose} className={`${btn} bg-stone-900 text-white hover:bg-stone-800`}>{tImport('close')}</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 font-sans text-sm transition-colors">
        <ArrowLeft size={13} strokeWidth={1.5} /> {tImport('back')}
      </button>

      {step === 'idle' && (
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={onDrop} onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-colors ${drag ? 'border-[#D4AF37] bg-amber-50/60' : 'border-stone-200 hover:border-stone-300'}`}>
          <Upload size={26} strokeWidth={1.5} className="mx-auto text-stone-300 mb-3" />
          <p className="font-sans text-sm text-stone-500">{tImport('dropzone')}</p>
          {fmtErr && <p className="font-sans text-xs text-red-500 mt-2">{fmtErr}</p>}
          <input ref={inputRef} type="file" accept=".csv" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
        </div>
      )}

      {step === 'preview' && rows.length > 0 && (
        <>
          <p className="font-sans text-[11px] text-stone-400 uppercase tracking-wider">{tImport('preview')} · {rows.length} total</p>
          <div className="overflow-x-auto rounded-sm border border-stone-100">
            <table className="w-full font-sans text-xs">
              <thead><tr className="bg-stone-50 border-b border-stone-100">
                {[tCsv('colName'), 'Email', tCsv('colPhone')].map(h => (
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
            {tCsv('importBtn', { count: rows.length })}
          </button>
        </>
      )}

      {step === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-10 font-sans text-sm text-stone-500">
          <span className="inline-block animate-spin">↻</span> {tImport('importing')}
        </div>
      )}
    </div>
  );
}
