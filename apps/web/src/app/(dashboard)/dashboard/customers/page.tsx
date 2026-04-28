/**
 * /dashboard/customers — Empty-state panel.
 * Shown in the right pane when no customer is selected.
 * On mobile this page is never visible (sidebar takes full width).
 */

export default function CustomersPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-8 text-center">
      <div className="space-y-3 max-w-xs">
        {/* Gold decorative dot */}
        <div className="w-2 h-2 rounded-full bg-[#D4AF37] mx-auto" />
        <h2 className="font-serif text-2xl font-light text-stone-700">
          Selecciona un cliente
        </h2>
        <p className="font-sans text-sm text-stone-400 leading-relaxed">
          Elige un cliente de la lista para ver su perfil, historial y citas.
        </p>
      </div>
    </div>
  );
}
