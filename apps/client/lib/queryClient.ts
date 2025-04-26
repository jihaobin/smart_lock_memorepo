import { QueryClient } from '@tanstack/react-query';

export default new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30, // 30分钟
    },
  },
});
