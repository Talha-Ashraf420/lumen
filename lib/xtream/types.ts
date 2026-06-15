// Types for the Xtream Codes player_api.php responses.
// Fields are intentionally permissive — providers vary in what they return.

export interface XtreamCredentials {
  /** Base URL incl. scheme + port, no trailing slash, e.g. http://host:8080 */
  baseUrl: string;
  username: string;
  password: string;
}

export interface UserInfo {
  username: string;
  password: string;
  message?: string;
  auth: number;
  status: string;
  exp_date: string | null;
  is_trial: string;
  active_cons: string;
  created_at?: string;
  max_connections: string;
  allowed_output_formats?: string[];
}

export interface ServerInfo {
  url?: string;
  port?: string;
  https_port?: string;
  server_protocol?: string;
  rtmp_port?: string;
  timezone?: string;
  timestamp_now?: number;
  time_now?: string;
}

export interface AuthResponse {
  user_info: UserInfo;
  server_info: ServerInfo;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface LiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string | null;
  added: string;
  category_id: string;
  custom_sid?: string;
  tv_archive: number;
  direct_source?: string;
  tv_archive_duration?: number;
}

export interface VodStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid?: string;
  direct_source?: string;
}

export interface VodInfo {
  info: {
    movie_image?: string;
    backdrop_path?: string[];
    plot?: string;
    cast?: string;
    director?: string;
    genre?: string;
    releasedate?: string;
    rating?: string;
    duration?: string;
    duration_secs?: number;
    youtube_trailer?: string;
    tmdb_id?: string;
    [k: string]: unknown;
  };
  movie_data: {
    stream_id: number;
    name: string;
    added: string;
    category_id: string;
    container_extension: string;
  };
}

export interface Series {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate?: string;
  release_date?: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path?: string[];
  youtube_trailer?: string;
  episode_run_time?: string;
  category_id: string;
}

export interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  season: number;
  added: string;
  info?: {
    movie_image?: string;
    plot?: string;
    duration?: string;
    duration_secs?: number;
    rating?: string;
    releasedate?: string;
    [k: string]: unknown;
  };
}

export interface SeriesInfo {
  seasons: Array<{
    id?: number;
    name?: string;
    season_number: number;
    cover?: string;
    overview?: string;
    air_date?: string;
    episode_count?: number;
  }>;
  info: {
    name?: string;
    cover?: string;
    plot?: string;
    cast?: string;
    director?: string;
    genre?: string;
    releaseDate?: string;
    rating?: string;
    backdrop_path?: string[];
    youtube_trailer?: string;
    [k: string]: unknown;
  };
  /** Keyed by season number as string */
  episodes: Record<string, Episode[]>;
}

export interface EpgListing {
  id: string;
  epg_id: string;
  title: string; // base64 encoded
  lang: string;
  start: string;
  end: string;
  description: string; // base64 encoded
  channel_id: string;
  start_timestamp: string;
  stop_timestamp: string;
  now_playing?: number;
  has_archive?: number;
}

export interface ShortEpgResponse {
  epg_listings: EpgListing[];
}

export type StreamKind = "live" | "movie" | "series";

/** A profile stored on the client (localStorage) for multi-login support. */
export interface Profile {
  id: string;
  label: string;
  baseUrl: string;
  username: string;
  password: string;
}
