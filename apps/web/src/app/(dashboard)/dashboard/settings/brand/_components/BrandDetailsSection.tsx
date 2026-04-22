'use client';

import { useState, useTransition, useRef } from 'react';
import { Loader2, Upload, Trash2, ImageIcon } from 'lucide-react';
import { toast }                              from 'sonner';
import { updateBrandDetailsAction, uploadOrgMediaAction } from '../actions';

const INDUSTRIES = [
  'Beleza', 'Saúde e Bem-estar', 'Fitness', 'Educação', 'Consultoria',
  'Fotografia', 'Tecnologia', 'Alimentação', 'Moda', 'Outro',
];

interface Props {
  orgId: string;
  initial: {
    name:       string;
    slug:       string;
    industry:   string | null;
    about:      string | null;
    bannerUrl:  string | null;
    logoUrl:    string | null;
  };
}

/** Tell the PreviewPanel iframe to reload after any save */
function notifyPreview() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skinsystem:settings-saved'));
  }
}

export function BrandDetailsSection({ orgId: _orgId, initial }: Props) {
  const [name,      setName]      = useState(initial.name);
  const [industry,  setIndustry]  = useState(initial.industry ?? '');
  const [about,     setAbout]     = useState(initial.about ?? '');
  const [pending,   startTransition] = useTransition();

  // Image URLs — start from DB, update instantly after upload
  const [logoUrl,         setLogoUrl]         = useState(initial.logoUrl   ?? '');
  const [bannerUrl,       setBannerUrl]        = useState(initial.bannerUrl ?? '');
  const [uploadingLogo,   setUploadingLogo]    = useState(false);
  const [uploadingBanner, setUploadingBanner]  = useState(false);

  const logoInput   = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  // ── Upload helpers ──────────────────────────────────────────

  async function handleUpload(file: File, type: 'logo' | 'banner') {
    // Instant local preview while uploading
    const blobUrl = URL.createObjectURL(file);
    if (type === 'logo') { setLogoUrl(blobUrl);   setUploadingLogo(true);   }
    else                 { setBannerUrl(blobUrl);  setUploadingBanner(true); }

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      const res = await uploadOrgMediaAction(fd);

      if (res.error || !res.data) {
        toast.error(res.error?.message ?? 'Erro ao carregar ficheiro');
        if (type === 'logo') setLogoUrl(initial.logoUrl ?? '');
        else setBannerUrl(initial.bannerUrl ?? '');
        return;
      }

      // Replace blob with the permanent CDN URL (+ cache-bust)
      if (type === 'logo') setLogoUrl(res.data.url);
      else setBannerUrl(res.data.url);

      toast.success(type === 'logo' ? 'Logo atualizado' : 'Banner atualizado');
      notifyPreview();

    } catch (err) {
      console.error('[upload] unexpected error:', err);
      toast.error('Erro inesperado ao carregar ficheiro');
      if (type === 'logo') setLogoUrl(initial.logoUrl ?? '');
      else setBannerUrl(initial.bannerUrl ?? '');

    } finally {
      // Always clear the spinner — even if the action throws or network fails
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
      URL.revokeObjectURL(blobUrl);
    }
  }

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleUpload(file, 'logo');
    e.target.value = '';
  }

  function onBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleUpload(file, 'banner');
    e.target.value = '';
  }

  // ── Save text fields ────────────────────────────────────────

  function handleSave() {
    startTransition(async () => {
      const res = await updateBrandDetailsAction({ name, industry: industry || null, about: about || null });
      if (res.error) { toast.error(res.error.message); return; }
      toast.success('Dados da marca guardados');
      notifyPreview();
    });
  }

  return (
    <section id="detalhes" className="space-y-5">
      <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
        Detalhes da marca
      </h2>

      {/* Banner */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div
          className="relative h-32 bg-stone-100 cursor-pointer group"
          onClick={() => bannerInput.current?.click()}
        >
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-stone-400">
              <ImageIcon size={20} strokeWidth={1.5} />
              <span className="text-xs">Clique para adicionar banner</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-medium bg-black/40 px-3 py-1.5 rounded-lg">
              {bannerUrl ? 'Alterar banner' : 'Adicionar banner'}
            </span>
          </div>
          {uploadingBanner && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-stone-600" />
            </div>
          )}
          <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={onBannerChange} />
        </div>

        {/* Logo */}
        <div className="px-5 pb-5 -mt-8 flex items-end gap-4">
          <div className="relative flex-shrink-0">
            <div
              className="w-16 h-16 rounded-2xl bg-white border-2 border-white shadow-md overflow-hidden cursor-pointer"
              onClick={() => logoInput.current?.click()}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                  <Upload size={16} strokeWidth={1.5} />
                </div>
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl">
                  <Loader2 size={14} className="animate-spin text-stone-600" />
                </div>
              )}
            </div>
            <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
          </div>
          <div className="flex gap-2 pb-1">
            <button onClick={() => logoInput.current?.click()}
              className="text-xs text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors">
              {logoUrl ? 'Editar logo' : 'Adicionar logo'}
            </button>
            {logoUrl && (
              <button onClick={() => setLogoUrl('')}
                className="p-1.5 text-stone-400 hover:text-rose-500 transition-colors">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Nome do negócio</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">URL da sua página de reservas</label>
          <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden focus-within:border-amber-300 focus-within:ring-1 focus-within:ring-amber-200 transition-colors">
            <span className="px-3 py-2.5 text-xs text-stone-400 bg-stone-50 border-r border-stone-200 whitespace-nowrap">
              skinsystem.pt/
            </span>
            <input
              type="text"
              value={initial.slug}
              readOnly
              className="flex-1 px-3 py-2.5 text-sm text-stone-500 bg-white focus:outline-none cursor-not-allowed"
            />
          </div>
          <p className="text-[10px] text-stone-400">O URL não pode ser alterado após a criação.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Indústria</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 bg-white focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Selecionar…</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Sobre</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            placeholder="Apresente o seu negócio aos clientes…"
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors resize-none"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button onClick={handleSave} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors">
            {pending && <Loader2 size={13} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </section>
  );
}
