// components/Carousel/index.tsx
import { Card } from "../Card";
import styles from "./styles.module.css";


export interface CarouselItem {
  id: number;
  title: string; // ✅ TODOS os itens precisam ter title!
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  mediaType: 'movie' | 'tv';
  current_season?: number;
  current_episode?: number;
  current_episode_title?: string;
  watched_at?: string;
}

interface CarouselProps {
  items: CarouselItem[];
}
interface CarouselProps {
  items: CarouselItem[];
}

export function Carousel({ items }: CarouselProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={styles.carousel}>
      {items.map((item) => (
        <div key={`${item.mediaType}-${item.id}${item.current_episode ? `-S${item.current_season}E${item.current_episode}` : ''}`} className={styles.slide}>
          <Card
            id={item.id}
            title={item.title}
            posterPath={item.poster_path}
            voteAverage={item.vote_average}
            year={item.release_date}
            mediaType={item.mediaType}
            // 👇 Passa as informações do episódio se existirem
            currentSeason={item.current_season}
            currentEpisode={item.current_episode}
            currentEpisodeTitle={item.current_episode_title}
          />
        </div>
      ))}
    </div>
  );
}