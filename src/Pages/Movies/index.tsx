// pages/Movies/index.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPopularMovies,
  getTrendingMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  getMoviesByCategory,
  getGenres,
  getMovieRecommendations
} from "../../services/movieService";
import { getRecentHistory } from "../../services/historyService";
import { Carousel } from "../../components/Carousel";
import type { Movie, Genre } from "../../types/movie";
import styles from "./styles.module.css";

// Interface para filmes com mediaType
interface MovieWithType extends Movie {
  mediaType: 'movie';
}

function Movies() {
  const [trending, setTrending] = useState<MovieWithType[]>([]);
  const [popular, setPopular] = useState<MovieWithType[]>([]);
  const [topRated, setTopRated] = useState<MovieWithType[]>([]);
  const [nowPlaying, setNowPlaying] = useState<MovieWithType[]>([]);
  const [upcoming, setUpcoming] = useState<MovieWithType[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [moviesByCategory, setMoviesByCategory] = useState<Record<number, MovieWithType[]>>({});
  const [recommended, setRecommended] = useState<MovieWithType[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar recomendações baseadas no histórico
  async function getRecommendationsFromHistory(historyItems: any[]): Promise<MovieWithType[]> {
    if (!historyItems || historyItems.length === 0) return [];

    // Pega os 3 itens mais recentes do histórico que são filmes
    const recentMovies = historyItems
      .filter(item => item.item_data?.media_type === 'movie')
      .slice(0, 3);

    if (recentMovies.length === 0) return [];

    // Para cada filme, busca recomendações similares
    const recommendationPromises = recentMovies.map(async (item) => {
      try {
        const itemId = parseInt(item.item_id);
        const recs = await getMovieRecommendations(itemId);
        return recs.map((m: any) => ({ ...m, mediaType: 'movie' }));
      } catch (error) {
        console.error('Erro ao buscar recomendações:', error);
        return [];
      }
    });

    const recommendationsArrays = await Promise.all(recommendationPromises);

    // Junta todas as recomendações, remove duplicatas e limita a 20
    const allRecs = recommendationsArrays.flat();
    const uniqueRecs = Array.from(
      new Map(allRecs.map(item => [item.id, item])).values()
    ).slice(0, 20);

    return uniqueRecs;
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [
          trendingData,
          popularData,
          topRatedData,
          nowPlayingData,
          upcomingData,
          genresData,
          recentHistoryData
        ] = await Promise.all([
          getTrendingMovies('week'),
          getPopularMovies(),
          getTopRatedMovies(),
          getNowPlayingMovies(),
          getUpcomingMovies(),
          getGenres(),
          getRecentHistory(20)
        ]);

        // Adiciona mediaType a todos os filmes
        setTrending(trendingData.map(m => ({ ...m, mediaType: 'movie' })));
        setPopular(popularData.map(m => ({ ...m, mediaType: 'movie' })));
        setTopRated(topRatedData.map(m => ({ ...m, mediaType: 'movie' })));
        setNowPlaying(nowPlayingData.map(m => ({ ...m, mediaType: 'movie' })));
        setUpcoming(upcomingData.map(m => ({ ...m, mediaType: 'movie' })));
        setGenres(genresData);

        // Carrega filmes por categoria (primeiros 5 gêneros)
        const catResults: Record<number, MovieWithType[]> = {};
        await Promise.all(
          genresData.slice(0, 5).map(async (g) => {
            const { results } = await getMoviesByCategory(g.id, 1);
            catResults[g.id] = results.slice(0, 15).map(m => ({ ...m, mediaType: 'movie' }));
          })
        );
        setMoviesByCategory(catResults);

        // Busca recomendações baseadas no histórico
        if (recentHistoryData.success && recentHistoryData.data) {
          const recommendations = await getRecommendationsFromHistory(recentHistoryData.data);
          setRecommended(recommendations);
        }

      } catch (error) {
        console.error("Erro ao carregar filmes:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Carregando filmes...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero Section com filme em destaque */}
      {trending.length > 0 && (
        <section className={styles.hero}>
          <img
            src={`https://image.tmdb.org/t/p/original${trending[0].backdrop_path}`}
            alt={trending[0].title}
            className={styles.heroBackdrop}
          />
          <div className={styles.heroGradient} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>🎬 EM ALTA</span>
            <h1 className={styles.heroTitle}>{trending[0].title}</h1>
            <p className={styles.heroOverview}>{trending[0].overview?.slice(0, 150)}...</p>
            <Link to={`/details/${trending[0].id}`} className={styles.watchButton}>
              ▶ ASSISTIR AGORA
            </Link>
          </div>
        </section>
      )}

      <div className={styles.content}>
        {/* RECOMENDADOS PARA VOCÊ */}
        {recommended.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>RECOMENDADOS PARA VOCÊ</h2>
              <span className={styles.sectionBadge}>🎯</span>
            </div>
            <p className={styles.sectionSubtitle}>
              Baseado no seu histórico de filmes
            </p>
            <Carousel items={recommended} />
          </section>
        )}

        {/* Em Alta */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>EM ALTA</h2>
            <span className={styles.sectionBadge}>🔥</span>
          </div>
          <Carousel items={trending.slice(0, 15)} />
        </section>

        {/* Nos Cinemas */}
        {nowPlaying.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>NOS CINEMAS</h2>
              <span className={styles.sectionBadge}>🎬</span>
            </div>
            <Carousel items={nowPlaying.slice(0, 15)} />
          </section>
        )}

        {/* Populares */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>POPULARES</h2>
            <span className={styles.sectionBadge}>📺</span>
          </div>
          <Carousel items={popular.slice(0, 15)} />
        </section>

        {/* CATEGORIAS */}
        {genres.slice(0, 5).map((genre) => (
          <section key={genre.id} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{genre.name}</h2>
              <Link to={`/category/${genre.id}`} className={styles.seeAll}>
                VER TUDO <span className={styles.seeAllArrow}>→</span>
              </Link>
            </div>
            <Carousel items={moviesByCategory[genre.id] || []} />
          </section>
        ))}

        {/* Em Breve */}
        {upcoming.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>EM BREVE</h2>
              <span className={styles.sectionBadge}>📅</span>
            </div>
            <Carousel items={upcoming.slice(0, 15)} />
          </section>
        )}

        {/* Mais Votados */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>MAIS VOTADOS</h2>
            <span className={styles.sectionBadge}>⭐</span>
          </div>
          <Carousel items={topRated.slice(0, 15)} />
        </section>
      </div>
    </div>
  );
}

export default Movies;