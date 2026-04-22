'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface SidebarCtxValue {
  collapsed: boolean;
  toggle:    () => void;
}

const SidebarCtx = createContext<SidebarCtxValue>({
  collapsed: false,
  toggle:    () => {},
});

export function useSidebarCtx() {
  return useContext(SidebarCtx);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <SidebarCtx.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarCtx.Provider>
  );
}
