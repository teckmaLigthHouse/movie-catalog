// services/tvService.ts
import { getApiKey } from "./keyService";
import type { 
  TVShow, 
  TVShowDetails, 
  TVGenre, 
  TVVideo,
  Season,
  Episode
} from "../types/tv";

const BASE_URL = "https://api.themoviedb.org/3";

// Função auxiliar para requisições (igual ao movieService, mas separada)
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
// 1. SÉRIES POPULARES
// =====================================================
export async function getPopularTVShows(page: number = 1): Promise<TVShow[]> {
  const data = await fetchFromTMDB(`/tv/popular?language=pt-BR&page=${page}`);
  return data.results;
}

// =====================================================
// 2. SÉRIES EM DESTAQUE (Trending)
// =====================================================
export async function getTrendingTVShows(timeWindow: 'day' | 'week' = 'week'): Promise<TVShow[]> {
  const data = await fetchFromTMDB(`/trending/tv/${timeWindow}?language=pt-BR`);
  return data.results;
}

// =====================================================
// 3. SÉRIES MAIS BEM AVALIADAS (Top Rated)
// =====================================================
export async function getTopRatedTVShows(page: number = 1): Promise<TVShow[]> {
  const data = await fetchFromTMDB(`/tv/top_rated?language=pt-BR&page=${page}`);
  return data.results;
}

// =====================================================
// 4. SÉRIES EM EXIBIÇÃO (On The Air)
// =====================================================
export async function getOnTheAirTVShows(page: number = 1): Promise<TVShow[]> {
  const data = await fetchFromTMDB(`/tv/on_the_air?language=pt-BR&page=${page}`);
  return data.results;
}

// =====================================================
// 5. DETALHES DE UMA SÉRIE (com temporadas!)
// =====================================================
export async function getTVShowDetails(id: number): Promise<TVShowDetails> {
  return await fetchFromTMDB(`/tv/${id}?language=pt-BR&append_to_response=seasons,credits,videos,images`);
}

// =====================================================
// 6. TEMPORADAS DE UMA SÉRIE
// =====================================================
export async function getTVShowSeasons(id: number): Promise<Season[]> {
  const data = await getTVShowDetails(id);
  return data.seasons;
}

// =====================================================
// 7. EPISÓDIOS DE UMA TEMPORADA
// =====================================================
export async function getSeasonEpisodes(
  tvId: number, 
  seasonNumber: number
): Promise<Episode[]> {
  const data = await fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}?language=pt-BR`);
  return data.episodes;
}

// =====================================================
// 8. VÍDEOS (TRAILERS) DE UMA SÉRIE
// =====================================================
export async function getTVShowVideos(tvId: number): Promise<TVVideo | null> {
  try {
    const dataPt = await fetchFromTMDB(`/tv/${tvId}/videos?language=pt-BR`);
    
    if (dataPt.results?.length > 0) {
      const trailer = dataPt.results.find((v: any) => v.type === "Trailer");
      return trailer || dataPt.results[0];
    }
    
    const dataEn = await fetchFromTMDB(`/tv/${tvId}/videos?language=en-US`);
    
    if (dataEn.results?.length > 0) {
      const trailer = dataEn.results.find((v: any) => v.type === "Trailer");
      return trailer || dataEn.results[0];
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar vídeos da série:', error);
    return null;
  }
}

// =====================================================
// 9. SÉRIES SIMILARES
// =====================================================
export async function getSimilarTVShows(tvId: number, page: number = 1): Promise<TVShow[]> {
  const data = await fetchFromTMDB(`/tv/${tvId}/similar?language=pt-BR&page=${page}`);
  return data.results;
}

// =====================================================
// 10. BUSCAR SÉRIES POR NOME
// =====================================================
export async function searchTVShows(
  query: string, 
  page: number = 1
): Promise<{ results: TVShow[]; total_pages: number }> {
  const data = await fetchFromTMDB(
    `/search/tv?query=${encodeURIComponent(query)}&language=pt-BR&page=${page}`
  );
  return { results: data.results, total_pages: data.total_pages };
}

// =====================================================
// 11. GÊNEROS DE SÉRIES
// =====================================================
export async function getTVGenres(): Promise<TVGenre[]> {
  const data = await fetchFromTMDB("/genre/tv/list?language=pt-BR");
  return data.genres;
}

// =====================================================
// 12. SÉRIES POR CATEGORIA (GÊNERO)
// =====================================================
export async function getTVShowsByCategory(
  genreId: number, 
  page: number = 1
): Promise<{ results: TVShow[]; total_pages: number }> {
  const data = await fetchFromTMDB(
    `/discover/tv?with_genres=${genreId}&language=pt-BR&page=${page}&sort_by=popularity.desc`
  );
  return { results: data.results, total_pages: data.total_pages };
}

// =====================================================
// 13. SÉRIES POR EMISSORA (NETFLIX, HBO, etc)
// =====================================================
export async function getTVShowsByNetwork(
  networkId: number, 
  page: number = 1
): Promise<{ results: TVShow[]; total_pages: number }> {
  const data = await fetchFromTMDB(
    `/discover/tv?with_networks=${networkId}&language=pt-BR&page=${page}&sort_by=popularity.desc`
  );
  return { results: data.results, total_pages: data.total_pages };
}

// =====================================================
// 14. RECOMENDAÇÕES BASEADAS EM UMA SÉRIE
// =====================================================
export async function getTVRecommendations(tvId: number, page: number = 1): Promise<TVShow[]> {
  const data = await fetchFromTMDB(`/tv/${tvId}/recommendations?language=pt-BR&page=${page}`);
  return data.results;
}

// =====================================================
// 15. ELENCO DE UMA SÉRIE
// =====================================================
export async function getTVCredits(tvId: number) {
  const data = await fetchFromTMDB(`/tv/${tvId}/credits?language=pt-BR`);
  return {
    cast: data.cast,
    crew: data.crew
  };
}