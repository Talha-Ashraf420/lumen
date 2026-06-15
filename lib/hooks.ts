"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export const useLiveCategories = () =>
  useQuery({ queryKey: ["live", "cats"], queryFn: api.liveCategories });

export const useLiveStreams = (categoryId?: string, enabled = true) =>
  useQuery({
    queryKey: ["live", "streams", categoryId ?? "all"],
    queryFn: () => api.liveStreams(categoryId),
    enabled,
  });

export const useVodCategories = () =>
  useQuery({ queryKey: ["vod", "cats"], queryFn: api.vodCategories });

export const useVodStreams = (categoryId?: string, enabled = true) =>
  useQuery({
    queryKey: ["vod", "streams", categoryId ?? "all"],
    queryFn: () => api.vodStreams(categoryId),
    enabled,
  });

export const useVodInfo = (id?: string) =>
  useQuery({ queryKey: ["vod", "info", id], queryFn: () => api.vodInfo(id!), enabled: !!id });

export const useSeriesCategories = () =>
  useQuery({ queryKey: ["series", "cats"], queryFn: api.seriesCategories });

export const useSeriesList = (categoryId?: string, enabled = true) =>
  useQuery({
    queryKey: ["series", "list", categoryId ?? "all"],
    queryFn: () => api.series(categoryId),
    enabled,
  });

export const useSeriesInfo = (id?: string) =>
  useQuery({ queryKey: ["series", "info", id], queryFn: () => api.seriesInfo(id!), enabled: !!id });

export const useEpg = (streamId?: number, enabled = true) =>
  useQuery({
    queryKey: ["epg", streamId],
    queryFn: () => api.epg(streamId!),
    enabled: !!streamId && enabled,
    staleTime: 60_000,
  });
