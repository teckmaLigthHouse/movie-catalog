// Header.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { getGenres } from "../../services/movieService";
import styles from "./styles.module.css";

export function Header() {
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getGenres().then(setGenres).catch(console.error);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setIsCategoriesOpen(false);
    }
  }

  function toggleCategories(e: React.MouseEvent) {
    e.stopPropagation();
    setIsCategoriesOpen(!isCategoriesOpen);
  }

  function closeMenu() {
    setIsMenuOpen(false);
    setIsCategoriesOpen(false);
  }

  return (
    <header className={styles.header}>
      <img
        src="/logocomnome.png"
        alt="BarretoFlix"
        className={styles.logoImage}
      />

      {/* Mobile Menu Button */}
      <button
        className={`${styles.menuButton} ${isMenuOpen ? styles.menuButtonOpen : ''}`}
        onClick={toggleMenu}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navigation */}
      <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
        <Link to="/home" onClick={closeMenu}>Home</Link>

        {/* Categories Dropdown */}
        <div className={styles.dropdown}>
          <button
            className={styles.dropbtn}
            onClick={toggleCategories}
          >
            Categorias {isCategoriesOpen ? '▴' : '▾'}
          </button>
          <div className={`${styles.dropdownContent} ${isCategoriesOpen ? styles.dropdownContentOpen : ''}`}>
            {genres.map((g) => (
              <Link key={g.id} to={`/category/${g.id}`} onClick={closeMenu}>
                {g.name}
              </Link>
            ))}
          </div>
        </div>

        <Link to="/search" onClick={closeMenu}>Buscar</Link>

        {/* Mobile Logout Button */}
        <div className={styles.mobileProfile}>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </nav>

      {/* Desktop Profile */}
      <div className={styles.profile}>
        <button onClick={handleLogout}>Sair</button>
      </div>
    </header>
  );
}