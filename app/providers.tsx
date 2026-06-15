"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Catalogs are large and the provider is slow — cache hard and serve
            // stale instantly while revalidating in the background.
            staleTime: 10 * 60 * 1000,
            gcTime: 24 * 60 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            // Never double the wait on a slow/timing-out endpoint.
            retry: 0,
          },
        },
      }),
  );

  const [persister, setPersister] = useState<ReturnType<typeof createSyncStoragePersister> | null>(null);

  useEffect(() => {
    setPersister(createSyncStoragePersister({ storage: window.localStorage, key: "lumen-query-cache" }));
  }, []);

  // Same client instance throughout — once the persister is ready (client-only),
  // swap to the persisting provider to restore/save the cache to localStorage.
  if (persister) {
    return (
      <PersistQueryClientProvider
        client={client}
        persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000, buster: "v1" }}
      >
        {children}
      </PersistQueryClientProvider>
    );
  }

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
