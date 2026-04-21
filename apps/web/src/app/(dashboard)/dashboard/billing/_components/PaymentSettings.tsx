'use client';

import * as Switch from '@radix-ui/react-switch';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { toggleOnlinePaymentAction, toggleAdvancePaymentAction } from '../actions';

interface PaymentSettingsProps {
  onlinePaymentEnabled:  boolean;
  advancePaymentRequired: boolean;
}

function ToggleRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label:    string;
  hint:     string;
  checked:  boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-stone-100 px-5 py-4 shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800">{label}</p>
        <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{hint}</p>
      </div>
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                   bg-stone-200 transition-colors duration-200
                   data-[state=checked]:bg-amber-400
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        <Switch.Thumb
          className="block h-5 w-5 rounded-full bg-white shadow-sm ring-0
                     transition-transform duration-200
                     data-[state=checked]:translate-x-5
                     data-[state=unchecked]:translate-x-0"
        />
      </Switch.Root>
    </div>
  );
}

export function PaymentSettings({ onlinePaymentEnabled, advancePaymentRequired }: PaymentSettingsProps) {
  const [online,   setOnline]   = useState(onlinePaymentEnabled);
  const [advance,  setAdvance]  = useState(advancePaymentRequired);
  const [pending,  startTransition] = useTransition();

  function handleOnline(value: boolean) {
    setOnline(value);
    startTransition(async () => {
      const res = await toggleOnlinePaymentAction(value);
      if (res.error) {
        toast.error(res.error);
        setOnline(!value);
      }
    });
  }

  function handleAdvance(value: boolean) {
    setAdvance(value);
    startTransition(async () => {
      const res = await toggleAdvancePaymentAction(value);
      if (res.error) {
        toast.error(res.error);
        setAdvance(!value);
      }
    });
  }

  return (
    <div className="space-y-3">
      <ToggleRow
        label="Aceitar pagamentos da página de agendamento"
        hint="Permite que clientes paguem online antecipadamente."
        checked={online}
        disabled={pending}
        onChange={handleOnline}
      />
      <ToggleRow
        label="Exigir pagamento antecipado"
        hint="Desative para que o pagamento seja opcional no momento do agendamento."
        checked={advance}
        disabled={pending || !online}
        onChange={handleAdvance}
      />
    </div>
  );
}
