// components/Header/index.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { getGenres } from "../../services/movieService";
import { getTVGenres } from "../../services/tvService";
import styles from "./styles.module.css";

export function Header() {
  const [movieGenres, setMovieGenres] = useState<{ id: number; name: string }[]>([]);
  const [tvGenres, setTVGenres] = useState<{ id: number; name: string }[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoviesOpen, setIsMoviesOpen] = useState(false);
  const [isTVOpen, setIsTVOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Carrega gêneros de filmes e séries
    Promise.all([
      getGenres(),
      getTVGenres()
    ]).then(([movies, tv]) => {
      setMovieGenres(movies);
      setTVGenres(tv);
    }).catch(console.error);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setIsMoviesOpen(false);
      setIsTVOpen(false);
    }
  }

  function toggleMovies(e: React.MouseEvent) {
    e.stopPropagation();
    setIsMoviesOpen(!isMoviesOpen);
    setIsTVOpen(false);
  }

  function toggleTV(e: React.MouseEvent) {
    e.stopPropagation();
    setIsTVOpen(!isTVOpen);
    setIsMoviesOpen(false);
  }

  function closeMenu() {
    setIsMenuOpen(false);
    setIsMoviesOpen(false);
    setIsTVOpen(false);
  }



  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""}`}>
      <div className={styles.headerLeft}>
        <Link to="/home" className={styles.logoLink} onClick={closeMenu}>
          <img src="/logocomnome.png" alt="BarretoFlix" className={styles.logoImage} />
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <Link
            to="/home"
            className={`${styles.navLink} ${isActive('/home') ? styles.active : ''}`}
          >
            Início
          </Link>

          {/* Filmes - Link principal + Dropdown */}
          <div
            className={styles.desktopDropdown}
            onMouseEnter={() => setIsMoviesOpen(true)}
            onMouseLeave={() => setIsMoviesOpen(false)}
          >
            <Link
              to="/movies"
              className={`${styles.navLink} ${isActive('/movies') ? styles.active : ''}`}
            >
              🎬 Filmes
            </Link>
            <button
              className={styles.dropdownArrow}
              onClick={toggleMovies}
            >
              <svg className={`${styles.dropdownIcon} ${isMoviesOpen ? styles.rotated : ''}`} viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M7 10l5 5 5-5z" />
              </svg>
            </button>

            {isMoviesOpen && (
              <div className={styles.desktopDropdownContent}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownTitle}>GÊNEROS DE FILMES</span>
                </div>
                <Link to="/movies" className={styles.dropdownLink}>
                  🎬 Todos os filmes
                </Link>
                <div className={styles.dropdownDivider}></div>
                {movieGenres.map((g) => (
                  <Link
                    key={g.id}
                    to={`/category/${g.id}`}
                    className={styles.dropdownLink}
                    onClick={closeMenu}
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Séries - Link principal + Dropdown */}
          <div
            className={styles.desktopDropdown}
            onMouseEnter={() => setIsTVOpen(true)}
            onMouseLeave={() => setIsTVOpen(false)}
          >
            <Link
              to="/series"
              className={`${styles.navLink} ${isActive('/series') ? styles.active : ''}`}
            >
              📺 Séries
            </Link>
            <button
              className={styles.dropdownArrow}
              onClick={toggleTV}
            >
              <svg className={`${styles.dropdownIcon} ${isTVOpen ? styles.rotated : ''}`} viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M7 10l5 5 5-5z" />
              </svg>
            </button>

            {isTVOpen && (
              <div className={styles.desktopDropdownContent}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownTitle}>GÊNEROS DE SÉRIES</span>
                </div>
                <Link to="/series" className={styles.dropdownLink}>
                  📺 Todas as séries
                </Link>
                <div className={styles.dropdownDivider}></div>
                {tvGenres.map((g) => (
                  <Link
                    key={g.id}
                    to={`/tv/category/${g.id}`}
                    className={styles.dropdownLink}
                    onClick={closeMenu}
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/search"
            className={`${styles.navLink} ${isActive('/search') ? styles.active : ''}`}
          >
            🔍 Buscar
          </Link>

          <Link
            to="/profile"
            className={`${styles.navLink} ${isActive('/profile') ? styles.active : ''}`}
          >
            <span className={styles.profileIcon}>👤</span>
            Perfil
          </Link>
        </nav>
      </div>

      {/* Desktop Right Section */}
      <div className={styles.headerRight}>


        <div className={styles.desktopProfile}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Sair
          </button>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        className={`${styles.menuButton} ${isMenuOpen ? styles.menuButtonOpen : ""}`}
        onClick={toggleMenu}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}>
        <div className={styles.mobileMenuHeader}>
          <img src="/logocomnome.png" alt="BarretoFlix" className={styles.mobileLogo} />

        </div>

        <div className={styles.mobileMenuContent}>


          <Link to="/home" onClick={closeMenu} className={isActive('/home') ? styles.activeLink : ''}>
            <span>🏠</span> Início
          </Link>

          {/* Filmes no Mobile */}
          <div className={styles.mobileDropdown}>
            <Link
              to="/movies"
              onClick={closeMenu}
              className={`${styles.mobileLink} ${isActive('/movies') ? styles.activeLink : ''}`}
            >
              <span>🎬</span> Filmes
            </Link>
            <button
              className={styles.mobileDropdownBtn}
              onClick={toggleMovies}
            >
              <span className={styles.mobileDropdownIcon}>
                {isMoviesOpen ? "▲" : "▼"}
              </span>
            </button>
          </div>

          {isMoviesOpen && (
            <div className={styles.mobileSubmenu}>
              <Link
                to="/movies"
                onClick={closeMenu}
                className={styles.mobileSubmenuLink}
              >
                Todos os filmes
              </Link>
              {movieGenres.map((g) => (
                <Link
                  key={g.id}
                  to={`/category/${g.id}`}
                  onClick={closeMenu}
                  className={styles.mobileSubmenuLink}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          )}

          {/* Séries no Mobile */}
          <div className={styles.mobileDropdown}>
            <Link
              to="/series"
              onClick={closeMenu}
              className={`${styles.mobileLink} ${isActive('/series') ? styles.activeLink : ''}`}
            >
              <span>📺</span> Séries
            </Link>
            <button
              className={styles.mobileDropdownBtn}
              onClick={toggleTV}
            >
              <span className={styles.mobileDropdownIcon}>
                {isTVOpen ? "▲" : "▼"}
              </span>
            </button>
          </div>

          {isTVOpen && (
            <div className={styles.mobileSubmenu}>
              <Link
                to="/series"
                onClick={closeMenu}
                className={styles.mobileSubmenuLink}
              >
                Todas as séries
              </Link>
              {tvGenres.map((g) => (
                <Link
                  key={g.id}
                  to={`/tv/category/${g.id}`}
                  onClick={closeMenu}
                  className={styles.mobileSubmenuLink}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          )}

          <Link to="/search" onClick={closeMenu} className={isActive('/search') ? styles.activeLink : ''}>
            <span>🔍</span> Buscar
          </Link>

          <Link to="/profile" onClick={closeMenu} className={isActive('/profile') ? styles.activeLink : ''}>
            <span>👤</span> Meu Perfil
          </Link>

          <button className={styles.mobileLogout} onClick={handleLogout}>
            <span>🚪</span> Sair
          </button>
        </div>
      </div>
    </header>
  );
}