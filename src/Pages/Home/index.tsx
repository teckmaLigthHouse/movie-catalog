// pages/Home/index.tsx
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getPopularMovies,
  getTrendingMovies
} from "../../services/movieService";
import {
  getPopularTVShows,
  getTrendingTVShows
} from "../../services/tvService";
import { getRecentHistory } from "../../services/historyService";
import { getUserList } from "../../services/listService";
import { getMovieDetails } from "../../services/movieService";
import { getTVShowDetails } from "../../services/tvService";
import { getMovieRecommendations } from "../../services/movieService";
import { getTVRecommendations } from "../../services/tvService";
import { Carousel } from "../../components/Carousel";
import type { Movie } from "../../types/movie";
import type { TVShow } from "../../types/tv";
import styles from "./styles.module.css";

// Tipo unificado para exibição
interface MixedItem {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  mediaType: 'movie' | 'tv';
  overview?: string;
  // Campos específicos para séries
  current_season?: number;
  current_episode?: number;
  current_episode_title?: string;
  watched_at?: string;
}

function Home() {
  const [trendingAll, setTrendingAll] = useState<MixedItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MixedItem[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<MixedItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<MixedItem[]>([]);
  const [recommended, setRecommended] = useState<MixedItem[]>([]);
  const [myList, setMyList] = useState<MixedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cache para evitar buscar o mesmo item várias vezes
  const itemCache = new Map<string, MixedItem>();

  // =====================================================
  // FUNÇÃO: Buscar detalhes frescos do histórico
  // =====================================================
  const fetchHistoryDetails = useCallback(async (items: any[]): Promise<MixedItem[]> => {
    const promises = items.map(async (item) => {
      const id = parseInt(item.item_id);
      const mediaType = item.item_type === 'tv' ? 'tv' : 'movie';
      const cacheKey = `${mediaType}-${id}`;

      if (itemCache.has(cacheKey)) {
        return itemCache.get(cacheKey)!;
      }

      try {
        if (mediaType === 'movie') {
          const details = await getMovieDetails(id);
          const mixed: MixedItem = {
            id: details.id,
            title: details.title,
            poster_path: details.poster_path,
            backdrop_path: details.backdrop_path,
            vote_average: details.vote_average,
            release_date: details.release_date,
            overview: details.overview,
            mediaType: 'movie'
          };
          itemCache.set(cacheKey, mixed);
          return mixed;
        } else {
          const details = await getTVShowDetails(id);
          const mixed: MixedItem = {
            id: details.id,
            title: details.name,
            poster_path: details.poster_path,
            backdrop_path: details.backdrop_path,
            vote_average: details.vote_average,
            release_date: details.first_air_date,
            overview: details.overview,
            mediaType: 'tv'
          };
          itemCache.set(cacheKey, mixed);
          return mixed;
        }
      } catch (error) {
        console.error(`Erro ao buscar detalhes do item ${id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter((item): item is MixedItem => item !== null);
  }, []);

  // =====================================================
  // FUNÇÃO: Buscar recomendações baseadas no histórico
  // =====================================================
  const getRecommendationsFromHistory = useCallback(async (historyItems: any[]): Promise<MixedItem[]> => {
    if (!historyItems || historyItems.length === 0) return [];

    const recentItems = historyItems.slice(0, 3);

    const recommendationPromises = recentItems.map(async (item) => {
      try {
        const itemId = parseInt(item.item_id);
        const mediaType = item.item_type === 'tv' ? 'tv' : 'movie';

        if (mediaType === 'movie') {
          const recs = await getMovieRecommendations(itemId);
          return recs.map((m: any) => ({
            id: m.id,
            title: m.title,
            poster_path: m.poster_path,
            backdrop_path: m.backdrop_path,
            vote_average: m.vote_average,
            release_date: m.release_date,
            overview: m.overview,
            mediaType: 'movie' as const
          }));
        } else {
          const recs = await getTVRecommendations(itemId);
          return recs.map((s: any) => ({
            id: s.id,
            title: s.name,
            poster_path: s.poster_path,
            backdrop_path: s.backdrop_path,
            vote_average: s.vote_average,
            release_date: s.first_air_date,
            overview: s.overview,
            mediaType: 'tv' as const
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar recomendações:', error);
        return [];
      }
    });

    const recommendationsArrays = await Promise.all(recommendationPromises);
    const allRecs = recommendationsArrays.flat();
    const uniqueRecs = Array.from(
      new Map(allRecs.map(item => [item.id, item])).values()
    ).slice(0, 20);

    return uniqueRecs;
  }, []);

  // =====================================================
  // FUNÇÃO: Buscar detalhes de um item da watchlist
  // =====================================================
  const fetchWatchlistItem = useCallback(async (item: any): Promise<MixedItem | null> => {
    const cacheKey = `${item.item_type}-${item.item_id}`;

    if (itemCache.has(cacheKey)) {
      return itemCache.get(cacheKey)!;
    }

    try {
      if (item.item_type === 'movie') {
        const details = await getMovieDetails(parseInt(item.item_id));
        const mixed: MixedItem = {
          id: details.id,
          title: details.title,
          poster_path: details.poster_path,
          backdrop_path: details.backdrop_path,
          vote_average: details.vote_average,
          release_date: details.release_date,
          overview: details.overview,
          mediaType: 'movie'
        };
        itemCache.set(cacheKey, mixed);
        return mixed;
      } else {
        const details = await getTVShowDetails(parseInt(item.item_id));
        const mixed: MixedItem = {
          id: details.id,
          title: details.name,
          poster_path: details.poster_path,
          backdrop_path: details.backdrop_path,
          vote_average: details.vote_average,
          release_date: details.first_air_date,
          overview: details.overview,
          mediaType: 'tv'
        };
        itemCache.set(cacheKey, mixed);
        return mixed;
      }
    } catch (error) {
      console.error(`Erro ao buscar detalhes do item ${item.item_id}:`, error);
      return null;
    }
  }, []);

  // =====================================================
  // EFFECT: Carregar todos os dados da Home
  // =====================================================
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [
          trendingMovies,
          trendingShows,
          popularMoviesData,
          popularShowsData,
          recentHistoryData,
          watchlistResult
        ] = await Promise.all([
          getTrendingMovies('week'),
          getTrendingTVShows('week'),
          getPopularMovies(),
          getPopularTVShows(),
          getRecentHistory(20),
          getUserList('watchlist')
        ]);

        // =====================================================
        // 1. Processa EM ALTA (Misturado)
        // =====================================================
        const trendingMixed: MixedItem[] = [
          ...trendingMovies.map((movie: Movie) => ({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            vote_average: movie.vote_average,
            release_date: movie.release_date,
            overview: movie.overview,
            mediaType: 'movie' as const
          })),
          ...trendingShows.slice(0, 10).map((show: TVShow) => ({
            id: show.id,
            title: show.name,
            poster_path: show.poster_path,
            backdrop_path: show.backdrop_path,
            vote_average: show.vote_average,
            release_date: show.first_air_date,
            overview: show.overview,
            mediaType: 'tv' as const
          }))
        ].sort((a, b) => b.vote_average - a.vote_average).slice(0, 20);

        setTrendingAll(trendingMixed);

        // =====================================================
        // 2. Processa FILMES POPULARES
        // =====================================================
        setPopularMovies(popularMoviesData.map((movie: Movie) => ({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
          mediaType: 'movie' as const
        })));

        // =====================================================
        // 3. Processa SÉRIES POPULARES
        // =====================================================
        setPopularTVShows(popularShowsData.map((show: TVShow) => ({
          id: show.id,
          title: show.name,
          poster_path: show.poster_path,
          backdrop_path: show.backdrop_path,
          vote_average: show.vote_average,
          release_date: show.first_air_date,
          mediaType: 'tv' as const
        })));

        // =====================================================
        // 4. Processa HISTÓRICO (Continue Assistindo)
        // =====================================================
        if (recentHistoryData.success && recentHistoryData.data) {
          const historyData = recentHistoryData.data;

          // ✅ PRIMEIRO: Ordenar o histórico por data (mais recente primeiro)
          const sortedHistory = [...historyData].sort((a, b) =>
            new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime()
          );

          console.log(`📊 Histórico carregado: ${sortedHistory.length} itens`);
          console.log(`   🎬 Filmes: ${sortedHistory.filter((i: any) => i.item_type === 'movie').length}`);
          console.log(`   📺 Séries: ${sortedHistory.filter((i: any) => i.item_type === 'tv').length}`);
          console.log(`   ⏱️ Mais recente: ${new Date(sortedHistory[0]?.watched_at).toLocaleString()}`);

          // Busca dados frescos da API (passando o histórico JÁ ORDENADO)
          const detailedHistory = await fetchHistoryDetails(sortedHistory);

          // Cria um mapa com as datas e informações de episódio
          const historyMap = new Map();
          sortedHistory.forEach((item: any) => {
            historyMap.set(parseInt(item.item_id), {
              watched_at: item.watched_at,
              item_type: item.item_type,
              current_season: item.item_data?.current_season,
              current_episode: item.item_data?.current_episode,
              current_episode_title: item.item_data?.current_episode_title
            });
          });

          // Combina os dados da API com as informações do histórico
          const historyWithDetails = detailedHistory
            .map(item => {
              const historyInfo = historyMap.get(item.id);
              return {
                ...item,
                watched_at: historyInfo?.watched_at || new Date().toISOString(),
                current_season: historyInfo?.current_season,
                current_episode: historyInfo?.current_episode,
                current_episode_title: historyInfo?.current_episode_title
              };
            })
            // ✅ Já está na ordem correta? Vamos garantir de novo!
            .sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime());

          // Pega os 5 primeiros para Continue Assistindo
          setContinueWatching(historyWithDetails.slice(0, 5));

          // =====================================================
          // 5. Processa RECOMENDAÇÕES (baseado nos 10 MAIS RECENTES!)
          // =====================================================

          // ✅ USA O HISTÓRICO JÁ ORDENADO para pegar os 10 mais recentes
          const recentForRecommendations = sortedHistory.slice(0, 10);

          console.log(`🎯 Gerando recomendações baseadas nos ${recentForRecommendations.length} itens mais recentes`);
          console.log(`   📅 Período: ${new Date(recentForRecommendations[recentForRecommendations.length - 1]?.watched_at).toLocaleDateString()} até ${new Date(recentForRecommendations[0]?.watched_at).toLocaleDateString()}`);

          const recommendations = await getRecommendationsFromHistory(recentForRecommendations);
          setRecommended(recommendations);
        }

        // =====================================================
        // 6. Processa MINHA LISTA (Watchlist)
        // =====================================================
        if (watchlistResult.data && watchlistResult.data.length > 0) {
          const watchlistPromises = watchlistResult.data.map(item =>
            fetchWatchlistItem(item)
          );

          const watchlistResults = await Promise.all(watchlistPromises);
          const validItems = watchlistResults.filter((item): item is MixedItem => item !== null);

          setMyList(validItems);
        }

      } catch (error) {
        console.error("Erro ao carregar home:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [fetchHistoryDetails, fetchWatchlistItem, getRecommendationsFromHistory]);

  // =====================================================
  // RENDER: Loading State
  // =====================================================
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Carregando...</p>
      </div>
    );
  }

  // =====================================================
  // RENDER: Home Completa
  // =====================================================
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      {trendingAll.length > 0 && (
        <section className={styles.hero}>
          <img
            src={`https://image.tmdb.org/t/p/original${trendingAll[0].backdrop_path}`}
            alt={trendingAll[0].title}
            className={styles.heroBackdrop}
          />
          <div className={styles.heroGradient} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>
              {trendingAll[0].mediaType === 'movie' ? '🎬 FILME' : '📺 SÉRIE'}
            </span>
            <h1 className={styles.heroTitle}>{trendingAll[0].title}</h1>
            <p className={styles.heroOverview}>{trendingAll[0].overview?.slice(0, 150)}...</p>
            <div className={styles.heroButtons}>
              <Link
                to={`/${trendingAll[0].mediaType === 'movie' ? 'details' : 'tv'}/${trendingAll[0].id}`}
                className={styles.watchButton}
              >
                ▶ ASSISTIR
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className={styles.content}>
        {/* 1. CONTINUE ASSISTINDO */}
        {continueWatching.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>CONTINUE ASSISTINDO</h2>
              <span className={styles.sectionBadge}>⏱️</span>
            </div>
            <Carousel items={continueWatching} />
          </section>
        )}

        {/* 2. RECOMENDADOS PARA VOCÊ */}
        {recommended.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>RECOMENDADOS PARA VOCÊ</h2>
              <span className={styles.sectionBadge}>🎯</span>
            </div>
            <p className={styles.sectionSubtitle}>
              Baseado no seu histórico
            </p>
            <Carousel items={recommended} />
          </section>
        )}

        {/* 3. MINHA LISTA */}
        {myList.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>MINHA LISTA</h2>
              <span className={styles.sectionBadge}>📋</span>
            </div>
            <Carousel items={myList} />
          </section>
        )}

        {/* 4. EM ALTA */}
        {trendingAll.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>EM ALTA</h2>
              <span className={styles.sectionBadge}>🔥</span>
            </div>
            <Carousel items={trendingAll} />
          </section>
        )}

        {/* 5. FILMES POPULARES */}
        {popularMovies.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>FILMES POPULARES</h2>
              <Link to="/movies" className={styles.seeAll}>
                VER TUDO <span className={styles.seeAllArrow}>→</span>
              </Link>
            </div>
            <Carousel items={popularMovies.slice(0, 10)} />
          </section>
        )}

        {/* 6. SÉRIES POPULARES */}
        {popularTVShows.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>SÉRIES POPULARES</h2>
              <Link to="/series" className={styles.seeAll}>
                VER TUDO <span className={styles.seeAllArrow}>→</span>
              </Link>
            </div>
            <Carousel items={popularTVShows.slice(0, 10)} />
          </section>
        )}
      </div>
    </div>
  );
}

export default Home;