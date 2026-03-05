// types/tv.ts

// Interface base para séries (similar ao Movie, mas com campos específicos)
export interface TVShow {
  id: number;
  name: string; // ⚠️ DIFERENTE: filmes usam 'title'
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string; // ⚠️ DIFERENTE: filmes usam 'release_date'
  vote_average: number;
  vote_count?: number;
  popularity?: number;
  origin_country?: string[];
  original_language?: string;
  original_name?: string;
  genre_ids?: number[];
}

// Interface para criadores
export interface Creator {
  id: number;
  credit_id: string;
  name: string;
  gender: number;
  profile_path: string | null;
}

// Interface para temporada
export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
  vote_average?: number;
}

// Interface para episódio
export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  runtime?: number;
}

// Interface para detalhes completos da série
export interface TVShowDetails extends TVShow {
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: Season[];
  created_by: Creator[];
  networks: Network[];
  production_companies: ProductionCompany[];
  genres: TVGenre[];
  status: string;
  type: string;
  tagline?: string;
  in_production?: boolean;
  last_air_date?: string;
  homepage?: string;
}

// Interface para emissoras/streaming
export interface Network {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

// Interface para empresas produtoras
export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

// Interface para gêneros de séries
export interface TVGenre {
  id: number;
  name: string;
}

// Interface para vídeos (trailers, etc)
export interface TVVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

// Interface para resposta de busca
export interface TVSearchResponse {
  page: number;
  results: TVShow[];
  total_pages: number;
  total_results: number;
}