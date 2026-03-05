import { useState } from "react";
import styles from "./styles.module.css";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: () => Promise<void>;
  className?: string;
}

export function FavoriteButton({ isFavorite, onClick, className }: FavoriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await onClick();
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${styles.button} ${isFavorite ? styles.favorited : ''} ${className || ''}`}
      disabled={loading}
      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      {loading ? (
        <div className={styles.spinner} />
      ) : (
        <>
          <svg
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.heart}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {showFeedback && (
            <span className={styles.feedback}>
              {isFavorite ? "❤️ Favoritado" : "❤️ Removido"}
            </span>
          )}
        </>
      )}
    </button>
  );
}