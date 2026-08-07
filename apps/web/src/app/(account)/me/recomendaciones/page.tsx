import { Sparkles } from 'lucide-react';

export default function RecomendacionesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-cormorant text-xl font-semibold text-stone-900">Recomendaciones</h2>
        <p className="text-xs text-stone-400 mt-0.5 font-outfit">
          Consejos personalizados de tu especialista.
        </p>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center">
          <Sparkles size={22} className="text-stone-300" />
        </div>
        <div className="text-center max-w-xs">
          <p className="font-outfit text-sm font-medium text-stone-600">
            De momento, nada por aquí
          </p>
          <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
            Cuando tu especialista añada recomendaciones personalizadas para ti,
            aparecerán en esta sección.
          </p>
        </div>
      </div>
    </div>
  );
}
