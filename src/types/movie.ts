// types/movie.ts

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
}

export interface MovieDetails extends Movie {
  runtime: number;
  tagline: string;
  genres: Genre[];
  budget?: number;
  revenue?: number;
  status?: string;
}

export interface Genre {
  id: number;
  name: string;
}

// Para listas (watchlist/favorites)
export interface ListItem {
  item_id: string;
  item_type: 'movie' | 'series';
  list_type: 'watchlist' | 'favorites';
  // Dados opcionais que podem vir do banco
  title?: string;
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
}

// Para histórico
export interface HistoryItem {
  item_id: string;
  item_data: {
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date: string;
  };
  watched_at: string;
}

// Resposta padrão da API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  limit?: number;
  offset?: number;
}