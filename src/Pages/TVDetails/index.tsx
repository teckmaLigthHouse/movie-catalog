// pages/TVDetails/index.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getTVShowDetails,
  getTVShowVideos,
  getSimilarTVShows,
  getSeasonEpisodes
} from "../../services/tvService";
import { addTVShowToHistory } from "../../services/historyService";
import { addToList, removeFromList, isInList } from "../../services/listService";
import { Card } from "../../components/Card";
import { ListButton } from "../../components/ListButton";
import { FavoriteButton } from "../../components/FavoriteButton";
import type { TVShowDetails as TVShowDetailsType, Episode } from "../../types/tv";
import styles from "./styles.module.css";

function TVDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Hooks
  const [show, setShow] = useState<TVShowDetailsType | null>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [trailer, setTrailer] = useState<any>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // Estados específicos de séries
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [showSeasons, setShowSeasons] = useState(false);

  // Estado para o episódio selecionado
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  // Validação do ID
  const isValidId = id && id !== 'undefined' && !isNaN(Number(id));
  const tvId = isValidId ? Number(id) : null;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        if (!tvId) {
          throw new Error('ID da série inválido');
        }

        const [details, video, sims] = await Promise.all([
          getTVShowDetails(tvId),
          getTVShowVideos(tvId),
          getSimilarTVShows(tvId)
        ]);

        if (!details) {
          throw new Error('Série não encontrada');
        }

        setShow(details);
        setTrailer(video);
        setSimilar(sims);

        // Carrega episódios da primeira temporada
        if (details.seasons && details.seasons.length > 0) {
          const firstSeason = details.seasons.find(s => s.season_number > 0) || details.seasons[0];
          if (firstSeason) {
            const eps = await getSeasonEpisodes(tvId, firstSeason.season_number);
            setEpisodes(eps);
            setSelectedSeason(firstSeason.season_number);
            if (eps.length > 0) {
              setSelectedEpisode(eps[0]);
            }
          }
        }

        // Adiciona ao histórico (sem episódio ainda - primeiro acesso)
        await addTVShowToHistory(tvId);

        const [favoriteStatus, watchlistStatus] = await Promise.all([
          isInList(tvId.toString(), 'favorites'),
          isInList(tvId.toString(), 'watchlist')
        ]);

        setIsFavorite(favoriteStatus);
        setIsInWatchlist(watchlistStatus);

      } catch (err: any) {
        console.error('Erro ao carregar detalhes da série:', err);
        setError(err.message || 'Erro ao carregar série');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [tvId]);

  // Carrega episódios ao mudar de temporada
  useEffect(() => {
    async function loadEpisodes() {
      if (!tvId || !selectedSeason) return;

      try {
        const eps = await getSeasonEpisodes(tvId, selectedSeason);
        setEpisodes(eps);
        // Seleciona o primeiro episódio da nova temporada
        if (eps.length > 0) {
          setSelectedEpisode(eps[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar episódios:', error);
      }
    }

    loadEpisodes();
  }, [tvId, selectedSeason]);

  // Handlers
  const toggleFavorite = async () => {
    if (!tvId) return;

    try {
      if (isFavorite) {
        await removeFromList(tvId.toString(), 'favorites');
        setIsFavorite(false);
      } else {
        await addToList(tvId.toString(), 'series', 'favorites');
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Erro ao atualizar favoritos:", error);
    }
  };

  const toggleWatchlist = async () => {
    if (!tvId) return;

    try {
      if (isInWatchlist) {
        await removeFromList(tvId.toString(), 'watchlist');
        setIsInWatchlist(false);
      } else {
        await addToList(tvId.toString(), 'series', 'watchlist');
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error("Erro ao atualizar watchlist:", error);
    }
  };

  const handleEpisodeClick = (episode: Episode) => {
    setSelectedEpisode(episode);
    // 🔥 SALVA NO HISTÓRICO COM O EPISÓDIO ESPECÍFICO!
    if (tvId) {
      addTVShowToHistory(tvId, selectedSeason, episode.episode_number);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Carregando detalhes da série...</p>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>📺</span>
        <h2>Ops! Algo deu errado</h2>
        <p>{error || 'Série não encontrada'}</p>
        <button onClick={handleGoHome} className={styles.backButton}>
          Voltar para Home
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero com backdrop */}
      {show.backdrop_path && (
        <div className={styles.hero}>
          <img
            src={`https://image.tmdb.org/t/p/original${show.backdrop_path}`}
            alt={show.name}
            className={styles.heroBackdrop}
            loading="lazy"
          />
          <div className={styles.heroGradient} />
        </div>
      )}

      <div className={styles.contentWrapper}>
        {/* PLAYER PRINCIPAL */}
        {selectedEpisode && (
          <div className={styles.featuredPlayerSection}>
            <div className={styles.playerHeader}>
              <span className={styles.nowPlayingBadge}>▶ ASSISTINDO AGORA</span>
              <h2 className={styles.playerTitle}>
                {show.name} - S{selectedSeason} E{selectedEpisode.episode_number}: {selectedEpisode.name}
              </h2>
            </div>
            <div className={styles.featuredPlayerWrapper}>
              <iframe
                src={`https://playerflixapi.com/serie/${tvId}/${selectedSeason}/${selectedEpisode.episode_number}`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className={styles.featuredPlayer}
                title={selectedEpisode.name}
              />
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className={styles.infoSection}>
          <div className={styles.posterWrapper}>
            {show.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                alt={show.name}
                className={styles.poster}
                loading="lazy"
              />
            ) : (
              <div className={styles.noPoster}>📺</div>
            )}
          </div>

          <div className={styles.info}>
            <h1 className={styles.title}>{show.name}</h1>

            <div className={styles.metadata}>
              {show.first_air_date && (
                <span className={styles.year}>{show.first_air_date.slice(0, 4)}</span>
              )}
              {show.vote_average > 0 && (
                <span className={styles.rating}>
                  <span className={styles.star}>★</span>
                  {show.vote_average.toFixed(1)}
                </span>
              )}
              <span className={styles.runtime}>
                {show.number_of_seasons} {show.number_of_seasons === 1 ? 'temporada' : 'temporadas'}
              </span>
              {show.number_of_episodes > 0 && (
                <span className={styles.episodes}>
                  {show.number_of_episodes} episódios
                </span>
              )}
            </div>

            <div className={styles.statusInfo}>
              {show.status && (
                <span className={`${styles.status} ${styles[show.status.toLowerCase()]}`}>
                  {show.status}
                </span>
              )}
              {show.networks && show.networks.length > 0 && (
                <div className={styles.networks}>
                  {show.networks.map((network: any) => (
                    <span key={network.id} className={styles.network}>
                      {network.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {show.genres && show.genres.length > 0 && (
              <div className={styles.genres}>
                {show.genres.map((genre: any) => (
                  <Link
                    key={genre.id}
                    to={`/tv/category/${genre.id}`}
                    className={styles.genre}
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            )}

            {show.tagline && (
              <p className={styles.tagline}>"{show.tagline}"</p>
            )}

            {show.overview && (
              <div className={styles.synopsisSection}>
                <h3>Sinopse</h3>
                <p className={styles.synopsis}>{show.overview}</p>
              </div>
            )}

            {show.created_by && show.created_by.length > 0 && (
              <div className={styles.creators}>
                <h3>Criadores</h3>
                <div className={styles.creatorList}>
                  {show.created_by.map((creator: any) => (
                    <span key={creator.id} className={styles.creator}>
                      {creator.name}
                    </span>
                  ))}
                </div>
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

        {/* Temporadas */}
        <div className={styles.seasonsSection}>
          <div className={styles.seasonsHeader}>
            <h3 className={styles.sectionTitle}>Temporadas</h3>
            <button
              className={styles.seasonsToggle}
              onClick={() => setShowSeasons(!showSeasons)}
            >
              {showSeasons ? 'Ocultar' : 'Mostrar'} temporadas
            </button>
          </div>

          {showSeasons && (
            <div className={styles.seasonsList}>
              {show.seasons
                .filter((season: any) => season.season_number > 0)
                .map((season: any) => (
                  <div
                    key={season.id}
                    className={`${styles.seasonCard} ${selectedSeason === season.season_number ? styles.selectedSeason : ''}`}
                    onClick={() => setSelectedSeason(season.season_number)}
                  >
                    {season.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${season.poster_path}`}
                        alt={season.name}
                        className={styles.seasonPoster}
                      />
                    ) : (
                      <div className={styles.seasonPosterPlaceholder}>📺</div>
                    )}
                    <div className={styles.seasonInfo}>
                      <h4 className={styles.seasonName}>{season.name}</h4>
                      <p className={styles.seasonDetails}>
                        {season.episode_count} episódios • {season.air_date?.slice(0, 4) || 'Ano desconhecido'}
                      </p>
                      {season.overview && (
                        <p className={styles.seasonOverview}>{season.overview.slice(0, 100)}...</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Episódios da temporada selecionada */}
        {episodes.length > 0 && (
          <div className={styles.episodesSection}>
            <h3 className={styles.sectionTitle}>
              Episódios - Temporada {selectedSeason}
            </h3>
            <div className={styles.episodesList}>
              {episodes.map((episode: Episode) => (
                <div
                  key={episode.id}
                  className={`${styles.episodeCard} ${selectedEpisode?.id === episode.id ? styles.selectedEpisode : ''}`}
                  onClick={() => handleEpisodeClick(episode)}
                >
                  {episode.still_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                      alt={episode.name}
                      className={styles.episodeStill}
                    />
                  ) : (
                    <div className={styles.episodeStillPlaceholder}>📺</div>
                  )}
                  <div className={styles.episodeInfo}>
                    <div className={styles.episodeHeader}>
                      <span className={styles.episodeNumber}>{episode.episode_number}.</span>
                      <h4 className={styles.episodeName}>{episode.name}</h4>
                      {episode.vote_average > 0 && (
                        <span className={styles.episodeRating}>★ {episode.vote_average.toFixed(1)}</span>
                      )}
                    </div>
                    {episode.overview && (
                      <p className={styles.episodeOverview}>{episode.overview}</p>
                    )}
                    {episode.air_date && (
                      <p className={styles.episodeAirDate}>
                        Exibição: {new Date(episode.air_date).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    {selectedEpisode?.id === episode.id && (
                      <span className={styles.nowPlaying}>▶ ASSISTINDO AGORA</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Séries Semelhantes */}
        {similar.length > 0 && (
          <div className={styles.similarSection}>
            <h3 className={styles.sectionTitle}>Séries Semelhantes</h3>
            <div className={styles.grid}>
              {similar.map((s: any) => (
                <Card
                  key={s.id}
                  id={s.id}
                  title={s.name}
                  posterPath={s.poster_path}
                  voteAverage={s.vote_average}
                  year={s.first_air_date}
                  mediaType="tv"
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

export default TVDetails;