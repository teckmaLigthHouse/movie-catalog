// pages/TVCategory/index.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getTVShowsByCategory, getTVGenres } from "../../services/tvService";
import { Card } from "../../components/Card";
import type { TVShow, TVGenre } from "../../types/tv";
import styles from "./styles.module.css";

function TVCategory() {
  const { id } = useParams<{ id: string }>();
  const genreId = Number(id);

  const [shows, setShows] = useState<TVShow[]>([]);
  const [genreName, setGenreName] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        if (isNaN(genreId)) {
          throw new Error('ID da categoria inválido');
        }

        const { results, total_pages } = await getTVShowsByCategory(genreId, page);
        setShows(results);
        setTotalPages(total_pages);

        const genres = await getTVGenres();
        const genre = genres.find((g: TVGenre) => g.id === genreId);
        setGenreName(genre ? genre.name : "Categoria");

        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar séries');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [genreId, page]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando séries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>📺</span>
        <h2>Ops! Algo deu errado</h2>
        <p>{error}</p>
        <Link to="/series" className={styles.backLink}>Voltar para Séries</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.categoryHeader}>
        <h1 className={styles.categoryTitle}>{genreName}</h1>
        <span className={styles.showCount}>{shows.length} séries</span>
      </div>

      {shows.length > 0 ? (
        <div className={styles.grid}>
          {shows.map((show) => (
            <Card
              key={show.id}
              id={show.id}
              title={show.name}
              posterPath={show.poster_path}
              voteAverage={show.vote_average}
              year={show.first_air_date}
              mediaType="tv"
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📺</span>
          <p>Nenhuma série encontrada nesta categoria</p>
          <Link to="/series" className={styles.backLink}>Voltar para Séries</Link>
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className={styles.pageButton}
          >
            ← Anterior
          </button>

          <div className={styles.pageInfo}>
            <span className={styles.currentPage}>{page}</span>
            <span className={styles.totalPages}>de {totalPages}</span>
          </div>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className={styles.pageButton}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}

export default TVCategory;