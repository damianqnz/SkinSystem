'use client';

import { useState, useEffect, useActionState } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { blockTimeAction, type BlockTimeState } from '../actions/block-time';

type SlotInfo = { time: string; date: string };

const REASONS = ['illness', 'vacation', 'training', 'other'] as const;

type BlockTranslations = {
  from: string; to: string; reasonLabel: string;
  confirm: string; success: string;
  reason: Record<string, string>;
};

interface BlockTimeFormProps {
  slot:    SlotInfo | null;
  t:       BlockTranslations;
  onClose: () => void;
}

export function BlockTimeForm({ slot, t, onClose }: BlockTimeFormProps) {
  const [reason, setReason] = useState<string>('illness');
  const [endTime, setEndTime] = useState(() => {
    if (!slot || !slot.time) return '';
    const [h = '0', m = '0'] = slot.time.split(':');
    const end = parseInt(h, 10) * 60 + parseInt(m, 10) + 60;
    return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
  });

  const [state, formAction, isPending] = useActionState<BlockTimeState, FormData>(
    blockTimeAction,
    { status: 'idle' },
  );

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(t.success);
      onClose();
    }
  }, [state, t.success, onClose]);

  return (
    <form action={formAction} className="px-5 pb-5 space-y-4">
      <input type="hidden" name="date" value={slot?.date ?? ''} />
      <input type="hidden" name="reason" value={reason} />

      <div>
        <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
          {t.from}
        </label>
        <input type="time" name="startTime" defaultValue={slot?.time ?? ''} className="input-editorial w-full text-sm tabular-nums" />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
          {t.to}
        </label>
        <input type="time" name="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-editorial w-full text-sm tabular-nums" />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
          {t.reasonLabel}
        </label>
        <Select.Root value={reason} onValueChange={setReason}>
          <Select.Trigger className="input-editorial w-full text-sm flex items-center justify-between">
            <Select.Value />
            <Select.Icon><ChevronDown size={14} className="text-stone-400" /></Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-white rounded-lg border border-stone-200 shadow-xl z-[60] overflow-hidden" position="popper" sideOffset={4}>
              <Select.Viewport className="p-1">
                {REASONS.map((r) => (
                  <Select.Item key={r} value={r} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-stone-50 outline-none data-[highlighted]:bg-stone-50">
                    <Select.ItemIndicator><Check size={12} className="text-[#D4AF37]" /></Select.ItemIndicator>
                    <Select.ItemText>{t.reason[r] ?? r}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {state.status === 'error' && (
        <p className="text-xs text-red-500 bg-red-50 rounded-md px-3 py-2">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {isPending ? '...' : t.confirm}
      </button>
    </form>
  );
}
