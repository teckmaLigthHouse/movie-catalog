// MovieCard.tsx
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";

export function MovieCard({ id, title, posterPath, voteAverage, releaseDate }: {
  id: number;
  title: string;
  posterPath: string | null;
  voteAverage?: number | null;
  releaseDate?: string | null;
}) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/details/${id}`);
  }

  // Valores padrão seguros
  const safeVoteAverage = voteAverage ?? 0;
  const safeReleaseDate = releaseDate ?? '';
  const safeTitle = title || 'Título indisponível';

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
            <span>🎬</span>
          </div>
        )}
        {safeVoteAverage > 0 && (
          <div className={styles.rating}>
            <span className={styles.star}>★</span>
            {safeVoteAverage.toFixed(1)}
          </div>
        )}
      </div>
      <div className={styles.info}>
        <h4 className={styles.title}>{safeTitle}</h4>
        {safeReleaseDate && (
          <p className={styles.year}>{safeReleaseDate.slice(0, 4)}</p>
        )}
      </div>
    </div>
  );
}