'use client';

import { SessionProvider } from "next-auth/react";
import { type ReactNode } from "react";

interface ClientProviderProps {
  children: ReactNode;
}

/**
 * Client-side wrapper component for SessionProvider
 * This ensures that all components using React hooks are properly marked as client components
 */
export function ClientProvider({ children }: ClientProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
