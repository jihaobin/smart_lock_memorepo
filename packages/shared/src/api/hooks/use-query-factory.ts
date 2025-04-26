import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';

import { PaginatedData } from '../../shared/types/common';
import { ApiClient } from '../core/api-client';

/**
 * 创建React Query hooks
 * 这是一个工厂函数，需要在应用层提供React Query的依赖
 */
export function createQueryHooks(client: ApiClient) {
  /**
   * 通用查询hook
   */
  function useApiQuery<TData = unknown>(
    queryKey: readonly unknown[],
    url: string,
    config?: AxiosRequestConfig,
    options?: Omit<UseQueryOptions<TData, Error, TData, readonly unknown[]>, 'queryKey' | 'queryFn'>
  ) {
    return useQuery<TData, Error, TData, readonly unknown[]>({
      queryKey,
      queryFn: () => client.get<TData>(url, config),
      ...options,
    });
  }

  /**
   * 分页查询hook
   */
  function usePaginatedQuery<TData = unknown>(
    queryKey: readonly unknown[],
    url: string,
    params: Record<string, unknown> = {},
    options?: Omit<
      UseQueryOptions<PaginatedData<TData>, Error, PaginatedData<TData>, readonly unknown[]>,
      'queryKey' | 'queryFn'
    >
  ) {
    return useQuery<PaginatedData<TData>, Error, PaginatedData<TData>, readonly unknown[]>({
      queryKey: [...queryKey, params],
      queryFn: () => client.getPage<TData>(url, params as Record<string, unknown>),
      ...options,
    });
  }

  /**
   * 无限加载分页查询hook
   */
  function useInfinitePaginatedQuery<TData = unknown>(
    queryKey: readonly unknown[],
    url: string,
    params: Record<string, unknown> = {},
    options?: Omit<
      UseInfiniteQueryOptions<
        PaginatedData<TData>,
        Error,
        PaginatedData<TData>,
        PaginatedData<TData>,
        readonly unknown[]
      >,
      'queryKey' | 'queryFn' | 'getNextPageParam'
    >
  ) {
    return useInfiniteQuery<PaginatedData<TData>, Error, PaginatedData<TData>>({
      queryKey: [...queryKey, params],
      queryFn: ({ pageParam = 1 }) =>
        client.getPage<TData>(url, {
          ...(params as Record<string, unknown>),
          page: pageParam as number,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage: PaginatedData<TData>) =>
        lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
      ...options,
    });
  }

  /**
   * 创建hook
   */
  function useApiMutation<TData = unknown, TVariables = unknown>(
    url: string,
    options?: UseMutationOptions<TData, Error, TVariables>
  ) {
    return useMutation<TData, Error, TVariables>({
      mutationFn:
        options?.mutationFn || ((variables: TVariables) => client.post<TData>(url, variables)),
      ...options,
    });
  }

  /**
   * 创建资源CRUD hooks
   */
  function createResourceHooks<T extends Record<string, unknown>>(resourceUrl: string) {
    return {
      useList: (
        params?: Record<string, unknown>,
        options?: Omit<
          UseQueryOptions<PaginatedData<T>, Error, PaginatedData<T>, readonly unknown[]>,
          'queryKey' | 'queryFn'
        >
      ) => usePaginatedQuery<T>([resourceUrl, 'list'], resourceUrl, params || {}, options),

      useInfiniteList: (
        params?: Record<string, unknown>,
        options?: Omit<
          UseInfiniteQueryOptions<
            PaginatedData<T>,
            Error,
            PaginatedData<T>,
            PaginatedData<T>,
            readonly unknown[]
          >,
          'queryKey' | 'queryFn' | 'getNextPageParam'
        >
      ) =>
        useInfinitePaginatedQuery<T>(
          [resourceUrl, 'infiniteList'],
          resourceUrl,
          params || {},
          options
        ),

      useDetail: (
        id: string | number,
        options?: Omit<UseQueryOptions<T, Error, T, readonly unknown[]>, 'queryKey' | 'queryFn'>
      ) => useApiQuery<T>([resourceUrl, 'detail', id], `${resourceUrl}/${id}`, {}, options),

      useCreate: (options?: Omit<UseMutationOptions<T, Error, Partial<T>>, 'mutationFn'>) =>
        useMutation<T, Error, Partial<T>>({
          mutationFn: (data: Partial<T>) => client.post<T>(resourceUrl, data),
          ...options,
        }),

      useUpdate: (
        options?: Omit<
          UseMutationOptions<T, Error, { id: string | number } & Partial<T>>,
          'mutationFn'
        >
      ) =>
        useMutation<T, Error, { id: string | number } & Partial<T>>({
          mutationFn: (variables: { id: string | number } & Partial<T>) => {
            const { id, ...data } = variables;
            return client.put<T>(`${resourceUrl}/${id}`, data);
          },
          ...options,
        }),

      usePartialUpdate: (
        options?: Omit<
          UseMutationOptions<T, Error, { id: string | number } & Partial<T>>,
          'mutationFn'
        >
      ) =>
        useMutation<T, Error, { id: string | number } & Partial<T>>({
          mutationFn: (variables: { id: string | number } & Partial<T>) => {
            const { id, ...data } = variables;
            return client.patch<T>(`${resourceUrl}/${id}`, data);
          },
          ...options,
        }),

      useDelete: (options?: Omit<UseMutationOptions<T, Error, string | number>, 'mutationFn'>) =>
        useMutation<T, Error, string | number>({
          mutationFn: (id: string | number) => client.delete<T>(`${resourceUrl}/${id}`),
          ...options,
        }),
    };
  }

  return {
    useApiQuery,
    usePaginatedQuery,
    useInfinitePaginatedQuery,
    useApiMutation,
    createResourceHooks,
    useQueryClient,
  };
}
