'use client';

import { useState, useTransition } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { Loader2, Hash, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateVisibilityAction } from '../actions';
import { AccordionSection } from './AccordionSection';

interface Props {
  initial: {
    showInSearchResults: boolean;
  };
}

export function VisibilitySection({ initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showInSearchResults, setShowInSearchResults] = useState(
    initial.showInSearchResults
  );

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateVisibilityAction({
        showInSearchResults,
      });

      if (result.error) {
        toast.error(result.error.message || 'Erro ao guardar visibilidade');
      } else {
        toast.success('Visibilidade guardada com sucesso');
      }
    });
  };

  return (
    <AccordionSection id="visibilidade" title="Visibilidade da página de agendamentos">

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-8">
        {/* Resultados de pesquisa */}
        <div>
          <h3 className="text-xs text-stone-400 font-medium mb-2">
            Resultados de pesquisa
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            Faça com que sua página de reservas apareça no Google e em outros
            motores de busca.
          </p>
          <div className="pb-4 border-b border-stone-50">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-stone-900">
                Aparecer nos resultados de pesquisa
              </p>
              <Switch.Root
                checked={showInSearchResults}
                onCheckedChange={setShowInSearchResults}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-stone-200 transition-colors data-[state=checked]:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <Switch.Thumb className="block h-4 w-4 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
              </Switch.Root>
            </div>
          </div>
        </div>
      </div>
    </AccordionSection>
  );
}
