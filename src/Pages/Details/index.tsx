import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getMovieDetails, getSimilarMovies, getMovieVideos } from "../../services/movieService";
import { addMovieToHistory } from "../../services/historyService";
import { addToList, removeFromList, isInList } from "../../services/listService";
import { MovieCard } from "../../components/MovieCard";
import { ListButton } from "../../components/ListButton";
import { FavoriteButton } from "../../components/FavoriteButton";
import type { MovieDetails as MovieDetailsType } from "../../types/movie";
import styles from "./styles.module.css";

function Details() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // TODOS OS HOOKS DEVEM VIR ANTES DE QUALQUER RETURN CONDICIONAL
  const [movie, setMovie] = useState<MovieDetailsType | null>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [trailer, setTrailer] = useState<any>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // Validação do ID (depois dos hooks)
  const isValidId = id && id !== 'undefined' && !isNaN(Number(id));
  const movieId = isValidId ? Number(id) : null;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        if (!movieId) {
          throw new Error('ID do filme inválido');
        }

        const [details, video, sims] = await Promise.all([
          getMovieDetails(movieId),
          getMovieVideos(movieId),
          getSimilarMovies(movieId)
        ]);

        if (!details) {
          throw new Error('Filme não encontrado');
        }

        setMovie(details);
        setTrailer(video);
        setSimilar(sims);

        // Adiciona ao histórico
        await addMovieToHistory(movieId);

        const [favoriteStatus, watchlistStatus] = await Promise.all([
          isInList(movieId.toString(), 'favorites'),
          isInList(movieId.toString(), 'watchlist')
        ]);

        setIsFavorite(favoriteStatus);
        setIsInWatchlist(watchlistStatus);

      } catch (err: any) {
        console.error('Erro ao carregar detalhes:', err);
        setError(err.message || 'Erro ao carregar filme');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [movieId]);

  // Handlers
  const toggleFavorite = async () => {
    if (!movieId) return;

    try {
      if (isFavorite) {
        await removeFromList(movieId.toString(), 'favorites');
        setIsFavorite(false);
      } else {
        await addToList(movieId.toString(), 'movie', 'favorites');
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Erro ao atualizar favoritos:", error);
    }
  };

  const toggleWatchlist = async () => {
    if (!movieId) return;

    try {
      if (isInWatchlist) {
        await removeFromList(movieId.toString(), 'watchlist');
        setIsInWatchlist(false);
      } else {
        await addToList(movieId.toString(), 'movie', 'watchlist');
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error("Erro ao atualizar watchlist:", error);
    }
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Carregando detalhes do filme...</p>
      </div>
    );
  }

  // Error state
  if (error || !movie) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>🎬</span>
        <h2>Ops! Algo deu errado</h2>
        <p>{error || 'Filme não encontrado'}</p>
        <button onClick={handleGoHome} className={styles.backButton}>
          Voltar para Home
        </button>
      </div>
    );
  }

  // Success state
  return (
    <div className={styles.container}>
      {/* Hero com backdrop */}
      {movie.backdrop_path && (
        <div className={styles.hero}>
          <img
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt={movie.title}
            className={styles.heroBackdrop}
            loading="lazy"
          />
          <div className={styles.heroGradient} />
        </div>
      )}

      <div className={styles.contentWrapper}>
        <div className={styles.infoSection}>
          <div className={styles.posterWrapper}>
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className={styles.poster}
                loading="lazy"
              />
            ) : (
              <div className={styles.noPoster}>🎬</div>
            )}
          </div>

          <div className={styles.info}>
            <h1 className={styles.title}>{movie.title}</h1>

            <div className={styles.metadata}>
              {movie.release_date && (
                <span className={styles.year}>{movie.release_date.slice(0, 4)}</span>
              )}
              {movie.vote_average > 0 && (
                <span className={styles.rating}>
                  <span className={styles.star}>★</span>
                  {movie.vote_average.toFixed(1)}
                </span>
              )}
              {movie.runtime > 0 && (
                <span className={styles.runtime}>{movie.runtime} min</span>
              )}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className={styles.genres}>
                {movie.genres.map((genre) => (
                  <Link
                    key={genre.id}
                    to={`/category/${genre.id}`}
                    className={styles.genre}
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            )}

            {movie.tagline && (
              <p className={styles.tagline}>"{movie.tagline}"</p>
            )}

            {movie.overview && (
              <div className={styles.synopsisSection}>
                <h3>Sinopse</h3>
                <p className={styles.synopsis}>{movie.overview}</p>
              </div>
            )}

            <div className={styles.actionButtons}>
              {trailer && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className={styles.trailerButton}
                >
                  <span className={styles.trailerIcon}>▶</span>
                  VER TRAILER
                </button>
              )}

              <ListButton
                isInList={isInWatchlist}
                onClick={toggleWatchlist}
              />

              <FavoriteButton
                isFavorite={isFavorite}
                onClick={toggleFavorite}
              />
            </div>
          </div>
        </div>

        {/* Player Section */}
        <div className={styles.playerSection}>
          <h3 className={styles.sectionTitle}>Assistir Agora</h3>
          <div className={styles.playerWrapper}>
            <iframe
              src={`https://playerflixapi.com/filme/${id}`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className={styles.player}
              title={movie.title}
              loading="lazy"
            />
          </div>
        </div>

        {/* Filmes Semelhantes */}
        {similar.length > 0 && (
          <div className={styles.similarSection}>
            <h3 className={styles.sectionTitle}>Filmes Semelhantes</h3>
            <div className={styles.grid}>
              {similar.map((m) => (
                <MovieCard
                  key={m.id}
                  id={m.id}
                  title={m.title}
                  posterPath={m.poster_path}
                  voteAverage={m.vote_average}
                  releaseDate={m.release_date}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal do Trailer */}
      {showTrailer && trailer && (
        <div className={styles.modalOverlay} onClick={() => setShowTrailer(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowTrailer(false)}>
              ✕
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title={trailer.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={styles.trailerIframe}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Details;