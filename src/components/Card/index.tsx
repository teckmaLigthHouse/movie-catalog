// components/Card/index.tsx
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";

export interface CardProps {
  id: number;
  title: string;
  posterPath: string | null;
  voteAverage?: number | null;
  year?: string | null;
  mediaType: 'movie' | 'tv';
  // Campos opcionais para séries com episódio (só no histórico)
  currentSeason?: number;
  currentEpisode?: number;
  currentEpisodeTitle?: string;
}

export function Card({
  id,
  title,
  posterPath,
  voteAverage,
  year,
  mediaType,
  currentSeason,
  currentEpisode,
  currentEpisodeTitle
}: CardProps) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/${mediaType === 'movie' ? 'details' : 'tv'}/${id}`);
  }

  const safeVoteAverage = voteAverage ?? 0;
  const safeYear = year ?? '';
  const safeTitle = title || 'Título indisponível';

  // Formata o texto do episódio (só para séries)
  const episodeText = mediaType === 'tv' && currentSeason && currentEpisode
    ? `S${currentSeason} E${currentEpisode}`
    : null;

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.posterWrapper}>
        {posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${posterPath}`}
            alt={safeTitle}
            className={styles.poster}
            loading="lazy"
          />
        ) : (
          <div className={styles.noPoster}>
            <span>{mediaType === 'movie' ? '🎬' : '📺'}</span>
          </div>
        )}

        {/* Container flexível para nota + episódio */}
        <div className={styles.ratingContainer}>
          {/* Episódio (só aparece se for série e tiver episódio) */}
          {episodeText && (
            <div className={styles.episodeBadge} title={currentEpisodeTitle || episodeText}>
              {episodeText}
            </div>
          )}

          {/* Nota (sempre aparece se tiver nota) */}
          {safeVoteAverage > 0 && (
            <div className={styles.rating}>
              <span className={styles.star}>★</span>
              {safeVoteAverage.toFixed(1)}
            </div>
          )}
        </div>
      </div>

      <div className={styles.info}>
        {/* Badge de FILME/SÉRIE */}
        <div className={styles.badgeContainer}>
          <div className={`${styles.badge} ${styles[mediaType]}`}>
            {mediaType === 'movie' ? '🎬 FILME' : '📺 SÉRIE'}
          </div>
        </div>

        <h4 className={styles.title}>{safeTitle}</h4>

        {safeYear && (
          <p className={styles.year}>{safeYear.slice(0, 4)}</p>
        )}
      </div>
    </div>
  );
}