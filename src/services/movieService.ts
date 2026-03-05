// services/movieService.ts
import { getApiKey } from "./keyService";
import type { Movie, MovieDetails, Genre } from "../types/movie";

const BASE_URL = "https://api.themoviedb.org/3";

// Função auxiliar para requisições
async function fetchFromTMDB(endpoint: string) {
  const token = await getApiKey();
  if (!token) throw new Error("Token não encontrado");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Erro TMDB: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// =====================================================
// 1. FILMES POPULARES
// =====================================================
export async function getPopularMovies(page: number = 1): Promise<Movie[]> {
  const data = await fetchFromTMDB(`/movie/popular?language=pt-BR&page=${page}`);
  return data.results;
}

// =====================================================
// 2. FILMES EM ALTA (TRENDING)
// =====================================================
export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<Movie[]> {
  const data = await fetchFromTMDB(`/trending/movie/${timeWindow}?language=pt-BR`);
  return data.results;
}

// =====================================================
// 3. FILMES MAIS BEM AVALIADOS
// =====================================================
export async function getTopRatedMovies(page: number = 1): Promise<Movie[]> {
  const data = await fetchFromTMDB(`/movie/top_rated?language=pt-BR&page=${page}`);
  return data.results;
}

// =====================================================
// 4. FILMES EM CARTAZ (NOW PLAYING)
// =====================================================
export async function getNowPlayingMovies(page: number = 1): Promise<Movie[]> {
  const data = await fetchFromTMDB(`/movie/now_playing?language=pt-BR&page=${page}`);
  return data.results;
}

// =====================================================
// 5. PRÓXIMOS LANÇAMENTOS (UPCOMING)
// =====================================================
export async function getUpcomingMovies(page: number = 1): Promise<Movie[]> {
  const data = await fetchFromTMDB(`/movie/upcoming?language=pt-BR&page=${page}`);
  return data.results;
}

// =====================================================
// 6. FILMES POR CATEGORIA (GÊNERO)
// =====================================================
export async function getMoviesByCategory(
  genreId: number, 
  page: number = 1
): Promise<{ results: Movie[]; total_pages: number }> {
  const data = await fetchFromTMDB(
    `/discover/movie?with_genres=${genreId}&language=pt-BR&page=${page}&sort_by=popularity.desc`
  );
  return { results: data.results, total_pages: data.total_pages };
}

// =====================================================
// 7. LISTA DE GÊNEROS
// =====================================================
export async function getGenres(): Promise<Genre[]> {
  const data = await fetchFromTMDB("/genre/movie/list?language=pt-BR");
  return data.genres;
}

// =====================================================
// 8. BUSCAR FILMES POR NOME
// =====================================================
export async function searchMovies(
  query: string, 
  page: number = 1
): Promise<{ results: Movie[]; total_pages: number }> {
  const data = await fetchFromTMDB(
    `/search/movie?query=${encodeURIComponent(query)}&language=pt-BR&page=${page}`
  );
  return { results: data.results, total_pages: data.total_pages };
}

// =====================================================
// 9. DETALHES DE UM FILME
// =====================================================
export async function getMovieDetails(id: number): Promise<MovieDetails> {
  return await fetchFromTMDB(`/movie/${id}?language=pt-BR`);
}

// =====================================================
// 10. FILMES SIMILARES
// =====================================================
export async function getSimilarMovies(id: number, page: number = 1): Promise<Movie[]> {
  const data = await fetchFromTMDB(`/movie/${id}/similar?language=pt-BR&page=${page}`);
  return data.results;
}

// =====================================================
// 11. RECOMENDAÇÕES BASEADAS EM UM FILME
// =====================================================
export async function getMovieRecommendations(id: number, page: number = 1): Promise<Movie[]> {
  const data = await fetchFromTMDB(`/movie/${id}/recommendations?language=pt-BR&page=${page}`);
  return data.results;
}

// =====================================================
// 12. VÍDEOS (TRAILERS) DE UM FILME
// =====================================================
export async function getMovieVideos(movieId: number) {
  try {
    // Tenta em português primeiro
    const dataPt = await fetchFromTMDB(`/movie/${movieId}/videos?language=pt-BR`);
    
    if (dataPt.results?.length > 0) {
      const trailer = dataPt.results.find((v: any) => v.type === "Trailer");
      return trailer || dataPt.results[0];
    }
    
    // Se não achar, tenta em inglês
    const dataEn = await fetchFromTMDB(`/movie/${movieId}/videos?language=en-US`);
    
    if (dataEn.results?.length > 0) {
      const trailer = dataEn.results.find((v: any) => v.type === "Trailer");
      return trailer || dataEn.results[0];
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    return null;
  }
}

// =====================================================
// 13. ELENCO DE UM FILME
// =====================================================
export async function getMovieCredits(movieId: number) {
  const data = await fetchFromTMDB(`/movie/${movieId}/credits?language=pt-BR`);
  return {
    cast: data.cast,
    crew: data.crew
  };
}