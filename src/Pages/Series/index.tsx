// pages/Series/index.tsx
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getPopularTVShows,
  getTrendingTVShows,
  getTopRatedTVShows,
  getOnTheAirTVShows,
  getTVShowsByCategory,
  getTVGenres,
  getTVRecommendations
} from "../../services/tvService";
import { getRecentHistory } from "../../services/historyService";
import { Carousel } from "../../components/Carousel";
import type { TVShow, TVGenre } from "../../types/tv";
import styles from "./styles.module.css";

// Interface para séries com mediaType e title (para o Carousel)
interface TVShowWithType extends TVShow {
  mediaType: 'tv';
  // 👇 NÃO adicionamos 'title' aqui, vamos usar diretamente no Carousel
}

function Series() {
  const [trending, setTrending] = useState<TVShowWithType[]>([]);
  const [popular, setPopular] = useState<TVShowWithType[]>([]);
  const [topRated, setTopRated] = useState<TVShowWithType[]>([]);
  const [onTheAir, setOnTheAir] = useState<TVShowWithType[]>([]);
  const [genres, setGenres] = useState<TVGenre[]>([]);
  const [showsByCategory, setShowsByCategory] = useState<Record<number, TVShowWithType[]>>({});
  const [recommended, setRecommended] = useState<TVShowWithType[]>([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // FUNÇÃO: Buscar recomendações baseadas no histórico
  // =====================================================
  const getRecommendationsFromHistory = useCallback(async (historyItems: any[]): Promise<TVShowWithType[]> => {
    if (!historyItems || historyItems.length === 0) return [];

    const recentShows = historyItems
      .filter(item => item.item_type === 'tv')
      .slice(0, 5);

    if (recentShows.length === 0) return [];

    const recommendationPromises = recentShows.map(async (item) => {
      try {
        const itemId = parseInt(item.item_id);
        const recs = await getTVRecommendations(itemId);
        return recs.slice(0, 3).map((s: any) => ({
          ...s,
          mediaType: 'tv'
          // 👇 NÃO adicionamos 'title' aqui
        }));
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
  // FUNÇÃO: Preparar item para o Carousel
  // =====================================================
  const prepareForCarousel = (show: TVShowWithType) => ({
    id: show.id,
    title: show.name, // 👈 MAPEIA name PARA title AQUI!
    poster_path: show.poster_path,
    vote_average: show.vote_average,
    release_date: show.first_air_date,
    mediaType: 'tv' as const
  });

  // =====================================================
  // EFFECT: Carregar dados
  // =====================================================
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [
          trendingData,
          popularData,
          topRatedData,
          onTheAirData,
          genresData,
          recentHistoryData
        ] = await Promise.all([
          getTrendingTVShows('week'),
          getPopularTVShows(),
          getTopRatedTVShows(),
          getOnTheAirTVShows(),
          getTVGenres(),
          getRecentHistory(20)
        ]);

        // Adiciona mediaType
        const mapTVShow = (show: TVShow): TVShowWithType => ({
          ...show,
          mediaType: 'tv'
        });

        setTrending(trendingData.map(mapTVShow));
        setPopular(popularData.map(mapTVShow));
        setTopRated(topRatedData.map(mapTVShow));
        setOnTheAir(onTheAirData.map(mapTVShow));
        setGenres(genresData);

        // Carrega séries por categoria
        const catResults: Record<number, TVShowWithType[]> = {};
        await Promise.all(
          genresData.slice(0, 5).map(async (g) => {
            const { results } = await getTVShowsByCategory(g.id, 1);
            catResults[g.id] = results.slice(0, 15).map(mapTVShow);
          })
        );
        setShowsByCategory(catResults);

        // Busca recomendações baseadas no histórico
        if (recentHistoryData.success && recentHistoryData.data) {
          const sortedHistory = [...recentHistoryData.data].sort((a, b) =>
            new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime()
          );

          const recommendations = await getRecommendationsFromHistory(sortedHistory);
          setRecommended(recommendations);
        }

      } catch (error) {
        console.error("Erro ao carregar séries:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [getRecommendationsFromHistory]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Carregando séries...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      {trending.length > 0 && (
        <section className={styles.hero}>
          <img
            src={`https://image.tmdb.org/t/p/original${trending[0].backdrop_path}`}
            alt={trending[0].name}
            className={styles.heroBackdrop}
          />
          <div className={styles.heroGradient} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>📺 EM ALTA</span>
            <h1 className={styles.heroTitle}>{trending[0].name}</h1>
            <p className={styles.heroOverview}>{trending[0].overview?.slice(0, 150)}...</p>
            <Link to={`/tv/${trending[0].id}`} className={styles.watchButton}>
              ▶ ASSISTIR AGORA
            </Link>
          </div>
        </section>
      )}

      <div className={styles.content}>
        {/* RECOMENDADOS */}
        {recommended.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>RECOMENDADOS PARA VOCÊ</h2>
              <span className={styles.sectionBadge}>🎯</span>
            </div>
            <p className={styles.sectionSubtitle}>
              Baseado no seu histórico de séries
            </p>
            <Carousel items={recommended.map(prepareForCarousel)} />
          </section>
        )}

        {/* EM ALTA */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>EM ALTA</h2>
            <span className={styles.sectionBadge}>🔥</span>
          </div>
          <Carousel items={trending.slice(0, 15).map(prepareForCarousel)} />
        </section>

        {/* NO AR */}
        {onTheAir.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>NO AR</h2>
              <span className={styles.sectionBadge}>📡</span>
            </div>
            <Carousel items={onTheAir.slice(0, 15).map(prepareForCarousel)} />
          </section>
        )}

        {/* POPULARES */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>POPULARES</h2>
            <span className={styles.sectionBadge}>📺</span>
          </div>
          <Carousel items={popular.slice(0, 15).map(prepareForCarousel)} />
        </section>

        {/* CATEGORIAS */}
        {genres.slice(0, 5).map((genre) => (
          <section key={genre.id} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{genre.name}</h2>
              <Link to={`/tv/category/${genre.id}`} className={styles.seeAll}>
                VER TUDO <span className={styles.seeAllArrow}>→</span>
              </Link>
            </div>
            <Carousel items={(showsByCategory[genre.id] || []).map(prepareForCarousel)} />
          </section>
        ))}

        {/* MAIS VOTADOS */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>MAIS VOTADOS</h2>
            <span className={styles.sectionBadge}>⭐</span>
          </div>
          <Carousel items={topRated.slice(0, 15).map(prepareForCarousel)} />
        </section>
      </div>
    </div>
  );
}

export default Series;