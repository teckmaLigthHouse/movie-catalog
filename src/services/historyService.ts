import { supabase } from "../lib/supabaseClient";
import { getMovieDetails } from "./movieService";
import { getTVShowDetails } from "./tvService";
import type { HistoryItem, ApiResponse } from "../types/movie";

/**
 * Adiciona um filme ao histórico
 */
export async function addMovieToHistory(movieId: number): Promise<ApiResponse<null>> {
  try {
    const movieDetails = await getMovieDetails(movieId);
    
    const itemData = {
      id: movieDetails.id,
      title: movieDetails.title,
      poster_path: movieDetails.poster_path,
      backdrop_path: movieDetails.backdrop_path,
      vote_average: movieDetails.vote_average,
      release_date: movieDetails.release_date,
      overview: movieDetails.overview?.slice(0, 200),
      media_type: 'movie'
    };

    const { error } = await supabase.rpc('add_to_history', {
      p_item_id: movieId.toString(),
      p_item_type: 'movie',
      p_item_data: itemData
    });

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar ao histórico:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

/// services/historyService.ts - Versão com episódio no JSON
export async function addTVShowToHistory(
  showId: number, 
  seasonNumber?: number, 
  episodeNumber?: number
): Promise<ApiResponse<null>> {
  try {
    const showDetails = await getTVShowDetails(showId);
    
    // Busca detalhes do episódio se tiver
    let episodeDetails = null;
    if (seasonNumber && episodeNumber) {
      const { getSeasonEpisodes } = await import('./tvService');
      const episodes = await getSeasonEpisodes(showId, seasonNumber);
      episodeDetails = episodes.find(ep => ep.episode_number === episodeNumber);
    }
    
    // TUDO DENTRO DO MESMO JSON!
    const itemData = {
      id: showDetails.id,
      title: showDetails.name,
      poster_path: showDetails.poster_path,
      backdrop_path: showDetails.backdrop_path,
      vote_average: showDetails.vote_average,
      release_date: showDetails.first_air_date,
      overview: showDetails.overview?.slice(0, 200),
      media_type: 'tv',
      
      // Informações do episódio atual
      current_season: seasonNumber || 1,
      current_episode: episodeNumber || 1,
      current_episode_title: episodeDetails?.name || null,
      current_episode_still: episodeDetails?.still_path || null,
      
      // Para referência futura
      total_seasons: showDetails.number_of_seasons,
      total_episodes: showDetails.number_of_episodes
    };

    const { error } = await supabase.rpc('add_to_history', {
      p_item_id: showId.toString(),
      p_item_type: 'tv',
      p_item_data: itemData
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar série ao histórico:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

/**
 * Busca o histórico com paginação
 */
export async function getHistory(
  limit: number = 20,
  offset: number = 0,
  itemType?: 'movie' | 'tv'
): Promise<ApiResponse<HistoryItem[]>> {
  try {
    const { data, error } = await supabase.rpc('get_history', {
      p_limit: limit,
      p_offset: offset,
      p_item_type: itemType || null
    });

    if (error) throw error;

    return {
      success: true,
      data: data.data || [],
      total: data.total || 0,
      limit: data.limit || limit,
      offset: data.offset || offset
    };
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido', 
      data: [] 
    };
  }
}

/**
 * Busca os últimos itens do histórico
 */
export async function getRecentHistory(limit: number = 10): Promise<ApiResponse<HistoryItem[]>> {
  try {
    const { data, error } = await supabase.rpc('get_recent_history', {
      p_limit: limit
    });

    if (error) throw error;

    return { success: true, data: data.data || [] };
  } catch (error) {
    console.error('Erro ao buscar histórico recente:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido', 
      data: [] 
    };
  }
}

/**
 * Remove um item do histórico
 */
export async function removeFromHistory(itemId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase.rpc('remove_from_history', {
      p_item_id: itemId
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover do histórico:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Limpa todo o histórico
 */
export async function clearHistory(): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase.rpc('clear_history');

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Busca estatísticas do histórico
 */
export async function getHistoryStats(): Promise<ApiResponse<{
  total_items: number;
  unique_days: number;
  most_watched_type: 'movie' | 'tv' | null;
  last_week: number;
}>> {
  try {
    const { data, error } = await supabase.rpc('get_history_stats');

    if (error) throw error;
    return { success: true, data: data.data };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Verifica se um item está no histórico
 */
export async function isInHistory(itemId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('history')
      .select('id')
      .eq('item_id', itemId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Erro ao verificar histórico:', error);
    return false;
  }
}