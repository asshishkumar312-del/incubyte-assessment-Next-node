import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,    // Data is fresh for 2 minutes
      gcTime: 1000 * 60 * 10,       // Cache lives for 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
