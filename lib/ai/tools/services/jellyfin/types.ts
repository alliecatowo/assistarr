/**
 * TypeScript types for Jellyfin API responses
 */

export type MediaType = "Movie" | "Series" | "Episode" | "Season";

export interface ImageTags {
  Primary?: string;
  Backdrop?: string;
  Logo?: string;
  Thumb?: string;
}

export interface UserData {
  PlaybackPositionTicks: number;
  PlayCount: number;
  IsFavorite: boolean;
  Played: boolean;
  LastPlayedDate?: string;
  PlayedPercentage?: number;
  Key?: string;
}

export interface Studio {
  Name: string;
  Id?: string;
}

export interface Person {
  Name: string;
  Id: string;
  Role?: string;
  Type: "Actor" | "Director" | "Writer" | "Producer";
}

export interface MediaItem {
  Id: string;
  Name: string;
  Type: MediaType;
  ServerId?: string;
  ProductionYear?: number;
  Overview?: string;
  RunTimeTicks?: number;
  CommunityRating?: number;
  OfficialRating?: string;
  Genres?: string[];
  ImageTags?: ImageTags;
  BackdropImageTags?: string[];
  UserData?: UserData;
  DateCreated?: string;
  PremiereDate?: string;
  Studios?: Studio[];
  People?: Person[];
  IsFolder?: boolean;
  // Episode-specific fields
  SeriesName?: string;
  SeriesId?: string;
  SeasonId?: string;
  IndexNumber?: number;
  ParentIndexNumber?: number;
}

export interface SearchHint {
  ItemId: string;
  Id: string;
  Name: string;
  ProductionYear?: number;
  Type: string;
  PrimaryImageTag?: string;
  RunTimeTicks?: number;
  MediaType?: string;
}

export interface Library {
  Id: string;
  Name: string;
  ServerId?: string;
  CollectionType?: "movies" | "tvshows" | "music" | "photos";
  Type: string;
  ImageTags?: ImageTags;
}

export interface ItemsResponse {
  Items: MediaItem[];
  TotalRecordCount: number;
}

export interface SearchResponse {
  SearchHints: SearchHint[];
  TotalRecordCount: number;
}

export interface LibrariesResponse {
  Items: Library[];
  TotalRecordCount: number;
}

export interface JellyfinError {
  message?: string;
  statusCode?: number;
}
