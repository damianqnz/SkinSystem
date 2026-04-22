'use client';

import { useSidebarCtx } from './SidebarContext';

export function MainOffset({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarCtx();

  return (
    <div
      className={`flex flex-col min-h-screen ${collapsed ? 'md:pl-10' : 'md:pl-64'}`}
      style={{ transition: 'padding-left 0.2s ease' }}
    >
      {children}
    </div>
  );
}
