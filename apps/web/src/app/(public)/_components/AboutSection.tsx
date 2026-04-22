interface Props {
  orgName: string;
  about:   string | null;
}

export function AboutSection({ orgName, about }: Props) {
  if (!about) return null;

  return (
    <section id="sobre" className="py-14 border-t border-stone-100 dark:border-stone-800">
      <div className="mb-8">
        <p className="text-[11px] font-outfit font-medium text-stone-400 uppercase tracking-[0.2em] mb-2">
          Quem somos
        </p>
        <h2 className="font-cormorant text-4xl font-semibold text-stone-900 dark:text-stone-100">
          Sobre nós
        </h2>
        <div className="mt-3 w-10 h-px bg-amber-400/60" />
      </div>

      <div className="max-w-2xl">
        <p className="font-outfit text-[15px] text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line">
          {about}
        </p>
      </div>

      {/* Signature watermark */}
      <p className="mt-8 font-cormorant text-4xl text-stone-200 dark:text-stone-800 italic select-none pointer-events-none">
        {orgName}
      </p>
    </section>
  );
}
