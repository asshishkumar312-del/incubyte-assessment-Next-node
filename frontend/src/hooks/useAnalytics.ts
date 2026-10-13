import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { analyticsApi, AnalyticsSummary, DeptData, CountryData, DistributionBucket, TopEarner } from '@/lib/api';

// ─── Query Key Factory ──────────────────────────────────────────────────────
// Centralising keys keeps invalidation consistent across the app.
export const analyticsKeys = {
  all:          ['analytics']                                      as const,
  summary:      (currency: string) => ['analytics', 'summary',      currency] as const,
  byDepartment: (currency: string) => ['analytics', 'byDepartment', currency] as const,
  byCountry:    (currency: string) => ['analytics', 'byCountry',    currency] as const,
  distribution: (currency: string, buckets: number) => ['analytics', 'distribution', currency, buckets] as const,
  topEarners:   (currency: string, limit: number)   => ['analytics', 'topEarners',   currency, limit]   as const,
  dashboard:    (currency: string) => ['analytics', 'dashboard',    currency] as const,
};

// ─── Dashboard ──────────────────────────────────────────────────────────────
// Fetches summary + top-8 departments + top-5 earners in a single parallel
// Promise.all so all three resolve before any state is committed.
export interface DashboardData {
  summary:    AnalyticsSummary;
  deptData:   DeptData[];
  topEarners: TopEarner[];
}

export function useDashboard(currency: string) {
  const query = useQuery<DashboardData, Error>({
    queryKey: analyticsKeys.dashboard(currency),
    queryFn: async () => {
      const [summaryRes, deptRes, earnersRes] = await Promise.all([
        analyticsApi.summary(currency),
        analyticsApi.byDepartment(currency),
        analyticsApi.topEarners(currency, 5),
      ]);
      return {
        summary:    summaryRes.data,
        deptData:   deptRes.data.slice(0, 8),
        topEarners: earnersRes.data,
      };
    },
  });

  // Derived data — computed only when query.data changes (useMemo avoids
  // repeating Object.entries on every re-render)
  const employmentData = useMemo(() => {
    if (!query.data?.summary?.by_employment_type) return [];
    return Object.entries(query.data.summary.by_employment_type).map(
      ([name, value]) => ({ name, value })
    );
  }, [query.data]);

  const genderData = useMemo(() => {
    if (!query.data?.summary?.by_gender) return [];
    return Object.entries(query.data.summary.by_gender).map(
      ([name, val]) => ({ name, value: val.count })
    );
  }, [query.data]);

  return { ...query, employmentData, genderData };
}

// ─── Full Analytics ──────────────────────────────────────────────────────────
export interface FullAnalyticsData {
  summary:      AnalyticsSummary;
  deptData:     DeptData[];
  countryData:  CountryData[];
  distribution: DistributionBucket[];
  topEarners:   TopEarner[];
}

export function useFullAnalytics(currency: string) {
  const query = useQuery<FullAnalyticsData, Error>({
    queryKey: analyticsKeys.all.concat([currency] as any),
    queryFn: async () => {
      const [summaryRes, deptRes, countryRes, distRes, earnersRes] = await Promise.all([
        analyticsApi.summary(currency),
        analyticsApi.byDepartment(currency),
        analyticsApi.byCountry(currency),
        analyticsApi.distribution(currency, 12),
        analyticsApi.topEarners(currency, 10),
      ]);
      return {
        summary:      summaryRes.data,
        deptData:     deptRes.data,
        countryData:  countryRes.data,
        distribution: distRes.data,
        topEarners:   earnersRes.data,
      };
    },
  });

  const genderData = useMemo(() => {
    if (!query.data?.summary?.by_gender) return [];
    return Object.entries(query.data.summary.by_gender).map(([name, val]) => ({
      name,
      count:     val.count,
      avgSalary: Math.round(val.total / val.count),
    }));
  }, [query.data]);

  const employmentData = useMemo(() => {
    if (!query.data?.summary?.by_employment_type) return [];
    return Object.entries(query.data.summary.by_employment_type).map(
      ([name, value]) => ({ name, value })
    );
  }, [query.data]);

  return { ...query, genderData, employmentData };
}

// ─── Individual hooks (for granular use or background prefetch) ──────────────
export function useAnalyticsSummary(currency: string) {
  return useQuery({
    queryKey: analyticsKeys.summary(currency),
    queryFn:  () => analyticsApi.summary(currency).then(r => r.data),
  });
}

export function useAnalyticsByDepartment(currency: string) {
  return useQuery({
    queryKey: analyticsKeys.byDepartment(currency),
    queryFn:  () => analyticsApi.byDepartment(currency).then(r => r.data),
  });
}

export function useAnalyticsByCountry(currency: string) {
  return useQuery({
    queryKey: analyticsKeys.byCountry(currency),
    queryFn:  () => analyticsApi.byCountry(currency).then(r => r.data),
  });
}

export function useAnalyticsDistribution(currency: string, buckets = 12) {
  return useQuery({
    queryKey: analyticsKeys.distribution(currency, buckets),
    queryFn:  () => analyticsApi.distribution(currency, buckets).then(r => r.data),
  });
}

export function useTopEarners(currency: string, limit = 10) {
  return useQuery({
    queryKey: analyticsKeys.topEarners(currency, limit),
    queryFn:  () => analyticsApi.topEarners(currency, limit).then(r => r.data),
  });
}
