import { useState } from "react";
import styles from "./styles.module.css";

interface ListButtonProps {
  isInList: boolean;
  onClick: () => Promise<void>;
  className?: string;
}

export function ListButton({ isInList, onClick, className }: ListButtonProps) {
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
      className={`${styles.button} ${isInList ? styles.inList : ''} ${className || ''}`}
      disabled={loading}
      aria-label={isInList ? "Remover da lista" : "Adicionar à lista"}
    >
      {loading ? (
        <div className={styles.spinner} />
      ) : (
        <>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.icon}
          >
            {isInList ? (
              <polyline points="20 6 9 17 4 12" />
            ) : (
              <>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </>
            )}
          </svg>
          <span className={styles.text}>
            {isInList ? "Na Lista" : "Minha Lista"}
          </span>
          {showFeedback && (
            <span className={styles.feedback}>
              {isInList ? "✓ Removido" : "✓ Adicionado"}
            </span>
          )}
        </>
      )}
    </button>
  );
}