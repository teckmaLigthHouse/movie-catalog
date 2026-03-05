import { supabase } from "../lib/supabaseClient";
import type { ListItem, ApiResponse } from "../types/movie";

/**
 * Adiciona um item à lista
 */
export async function addToList(
  itemId: string,
  itemType: 'movie' | 'series',
  listType: 'watchlist' | 'favorites'
): Promise<ApiResponse<ListItem>> {
  try {
    const { data, error } = await supabase.rpc('add_to_list', {
      p_item_id: itemId,
      p_item_type: itemType,
      p_list_type: listType
    });

    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao adicionar item à lista:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Remove um item da lista
 */
export async function removeFromList(
  itemId: string,
  listType: 'watchlist' | 'favorites'
): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase.rpc('remove_from_list', {
      p_item_id: itemId,
      p_list_type: listType
    });

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover item da lista:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Obtém os itens da lista do usuário
 */
export async function getUserList(
  listType: 'watchlist' | 'favorites',
  itemType?: 'movie' | 'series'
): Promise<ApiResponse<ListItem[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    let query = supabase
      .from('my_lists')
      .select('*')
      .eq('user_id', user.id)
      .eq('list_type', listType);

    if (itemType) {
      query = query.eq('item_type', itemType);
    }
    
    const { data, error } = await query.order('id', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao obter lista:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Verifica se um item está na lista
 */
export async function isInList(
  itemId: string,
  listType: 'watchlist' | 'favorites'
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('my_lists')
      .select('item_id')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .eq('list_type', listType)
      .maybeSingle();
      
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Erro ao verificar item na lista:', error);
    return false;
  }
}