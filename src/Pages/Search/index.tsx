// pages/Search/index.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { searchMovies } from "../../services/movieService";
import { searchTVShows } from "../../services/tvService";
import { Card } from "../../components/Card";
import styles from "./styles.module.css";


// Tipos unificados
interface SearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  mediaType: 'movie' | 'tv';
}

type FilterYear = 'all' | '2024' | '2023' | '2022' | '2021' | '2020' | 'older';
type SortOption = 'relevance' | 'newest' | 'oldest' | 'rating';
type MediaFilter = 'all' | 'movie' | 'tv';

function Search() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filtros
  const [selectedYear, setSelectedYear] = useState<FilterYear>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar sugestões (filmes e séries)
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);
    try {
      // Busca filmes e séries em paralelo
      const [movieResults, tvResults] = await Promise.all([
        searchMovies(searchQuery, 1),
        searchTVShows(searchQuery, 1)
      ]);

      // Combina e formata os resultados
      const allResults: SearchResult[] = [
        ...movieResults.results.map((m: any) => ({
          id: m.id,
          title: m.title,
          poster_path: m.poster_path,
          vote_average: m.vote_average,
          release_date: m.release_date,
          mediaType: 'movie' as const
        })),
        ...tvResults.results.map((s: any) => ({
          id: s.id,
          title: s.name,
          poster_path: s.poster_path,
          vote_average: s.vote_average,
          release_date: s.first_air_date,
          mediaType: 'tv' as const
        }))
      ].slice(0, 5); // Limita a 5 sugestões no total

      setSuggestions(allResults);
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  // Debounce para sugestões
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (query.trim().length >= 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, fetchSuggestions]);

  // Função principal de busca
  const performSearch = useCallback(async (searchQuery: string, pageNum: number) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      // Busca filmes e séries em paralelo
      const [movieResults, tvResults] = await Promise.all([
        searchMovies(searchQuery, pageNum),
        searchTVShows(searchQuery, pageNum)
      ]);

      // Combina os resultados
      let allResults: SearchResult[] = [
        ...movieResults.results.map((m: any) => ({
          id: m.id,
          title: m.title,
          poster_path: m.poster_path,
          vote_average: m.vote_average,
          release_date: m.release_date,
          mediaType: 'movie' as const
        })),
        ...tvResults.results.map((s: any) => ({
          id: s.id,
          title: s.name,
          poster_path: s.poster_path,
          vote_average: s.vote_average,
          release_date: s.first_air_date,
          mediaType: 'tv' as const
        }))
      ];

      // Filtro por tipo (movie/tv)
      if (mediaFilter !== 'all') {
        allResults = allResults.filter(item => item.mediaType === mediaFilter);
      }

      // Filtro por ano
      if (selectedYear !== 'all') {
        if (selectedYear === 'older') {
          allResults = allResults.filter(item => {
            const year = parseInt((item.release_date || '').slice(0, 4) || '0');
            return year < 2020;
          });
        } else {
          allResults = allResults.filter(item =>
            item.release_date?.slice(0, 4) === selectedYear
          );
        }
      }

      // Ordenação
      switch (sortBy) {
        case 'newest':
          allResults.sort((a, b) =>
            (b.release_date || '').localeCompare(a.release_date || '')
          );
          break;
        case 'oldest':
          allResults.sort((a, b) =>
            (a.release_date || '').localeCompare(b.release_date || '')
          );
          break;
        case 'rating':
          allResults.sort((a, b) => b.vote_average - a.vote_average);
          break;
        default:
          // 'relevance' mantém a ordem combinada (filmes primeiro, depois séries)
          break;
      }

      setResults(allResults);
      setTotalPages(Math.max(movieResults.total_pages, tvResults.total_pages));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar filmes e séries. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, sortBy, mediaFilter]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setHasSearched(true);
    setPage(1);
    await performSearch(query, 1);
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    handleSearch();
  };

  const nextPage = () => {
    if (page < totalPages) {
      const newPage = page + 1;
      setPage(newPage);
      performSearch(query, newPage);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      performSearch(query, newPage);
    }
  };

  const clearFilters = () => {
    setSelectedYear('all');
    setSortBy('relevance');
    setMediaFilter('all');
    if (hasSearched) {
      performSearch(query, 1);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Buscar Filmes e Séries</h1>
        <p className={styles.subtitle}>Encontre seus títulos favoritos</p>
      </div>

      <div className={styles.searchSection} ref={searchRef}>
        <form onSubmit={handleSearch} className={styles.form}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Digite o nome do filme ou série..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className={styles.searchInput}
              autoComplete="off"
            />
            <button type="submit" className={styles.searchButton}>
              🔍 Buscar
            </button>
          </div>
        </form>

        {/* Sugestões */}
        {showSuggestions && suggestions.length > 0 && (
          <div className={styles.suggestions}>
            {suggestionsLoading ? (
              <div className={styles.suggestionsLoading}>
                <div className={styles.suggestionsSpinner}></div>
                <span>Buscando...</span>
              </div>
            ) : (
              suggestions.map((item) => (
                <div
                  key={`${item.mediaType}-${item.id}`}
                  className={styles.suggestionItem}
                  onClick={() => handleSuggestionClick(item)}
                >
                  {item.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                      alt={item.title}
                      className={styles.suggestionPoster}
                    />
                  ) : (
                    <div className={styles.suggestionPosterPlaceholder}>
                      {item.mediaType === 'movie' ? '🎬' : '📺'}
                    </div>
                  )}
                  <div className={styles.suggestionInfo}>
                    <span className={styles.suggestionTitle}>{item.title}</span>
                    <span className={styles.suggestionYear}>
                      {item.release_date?.slice(0, 4) || 'Ano desconhecido'}
                    </span>
                  </div>
                  <span className={styles.suggestionRating}>
                    ★ {item.vote_average.toFixed(1)}
                  </span>
                  <span className={`${styles.suggestionBadge} ${styles[item.mediaType]}`}>
                    {item.mediaType === 'movie' ? '🎬' : '📺'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Botão de filtros */}
      <button
        className={styles.filterToggle}
        onClick={() => setShowFilters(!showFilters)}
      >
        <span>🔍 Filtros e Ordenação</span>
        <span>{showFilters ? '▲' : '▼'}</span>
      </button>

      {/* Painel de filtros */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tipo</label>
            <select
              value={mediaFilter}
              onChange={(e) => setMediaFilter(e.target.value as MediaFilter)}
              className={styles.filterSelect}
            >
              <option value="all">Todos</option>
              <option value="movie">Apenas Filmes</option>
              <option value="tv">Apenas Séries</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Ano</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as FilterYear)}
              className={styles.filterSelect}
            >
              <option value="all">Todos os anos</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="older">Mais antigos (antes de 2020)</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className={styles.filterSelect}
            >
              <option value="relevance">Relevância</option>
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="rating">Melhor avaliação</option>
            </select>
          </div>

          <button
            onClick={clearFilters}
            className={styles.clearFilters}
          >
            Limpar filtros
          </button>

          <button
            onClick={() => performSearch(query, 1)}
            className={styles.applyFilters}
          >
            Aplicar filtros
          </button>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Buscando filmes e séries...</p>
        </div>
      )}

      {/* Resultados */}
      {!loading && hasSearched && (
        <>
          {results.length > 0 ? (
            <>
              <div className={styles.resultsInfo}>
                <span className={styles.resultsCount}>
                  {results.length} resultados encontrados
                </span>
                {mediaFilter !== 'all' && (
                  <span className={styles.activeFilter}>
                    Tipo: {mediaFilter === 'movie' ? 'Filmes' : 'Séries'}
                  </span>
                )}
                {selectedYear !== 'all' && (
                  <span className={styles.activeFilter}>
                    Ano: {selectedYear === 'older' ? 'Antes de 2020' : selectedYear}
                  </span>
                )}
                {sortBy !== 'relevance' && (
                  <span className={styles.activeFilter}>
                    Ordenado por: {
                      sortBy === 'newest' ? 'Mais recentes' :
                        sortBy === 'oldest' ? 'Mais antigos' :
                          'Melhor avaliação'
                    }
                  </span>
                )}
              </div>

              <div className={styles.results}>
                {results.map((item) => (
                  <Card
                    key={`${item.mediaType}-${item.id}`}
                    id={item.id}
                    title={item.title}
                    posterPath={item.poster_path}
                    voteAverage={item.vote_average}
                    year={item.release_date}
                    mediaType={item.mediaType}
                  />
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={prevPage}
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
                    onClick={nextPage}
                    disabled={page === totalPages}
                    className={styles.pageButton}
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.noResults}>
              <span className={styles.noResultsIcon}>🔍</span>
              <h3>Nenhum resultado encontrado</h3>
              <p>Tente buscar com outro termo ou ajuste os filtros</p>
            </div>
          )}
        </>
      )}

      {/* Estado inicial */}
      {!hasSearched && !loading && (
        <div className={styles.initialState}>
          <span className={styles.initialIcon}>🎬</span>
          <h3>Busque por filmes e séries</h3>
          <p>Digite o nome de um título para começar</p>
        </div>
      )}
    </div>
  );
}

export default Search;