import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '../../design-system/components';
import { cn } from '../../utils/styles';
import styles from './LandingNav.module.css';

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(styles.nav, isScrolled && styles.scrolled)}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>🎬</div>
          <span className={styles.wordmark}>DirectorByte</span>
        </Link>

        <div className={styles.desktopLinks}>
          <a href="#features" className={styles.link}>Features</a>
          <a href="#pipeline" className={styles.link}>How it works</a>
          <Link to="/pricing" className={styles.link}>Pricing</Link>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => navigate('/signin')} className={styles.signInBtn}>
            Sign In
          </Button>
          <Button variant="primary" onClick={() => navigate('/signup')}>
            Get Started
          </Button>
          <button className={styles.menuBtn} onClick={() => setIsMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(styles.mobileMenu, isMenuOpen && styles.open)}>
        <div className={styles.menuHeader}>
          <Link to="/" className={styles.logo} onClick={() => setIsMenuOpen(false)}>
            <div className={styles.logoIcon}>🎬</div>
            <span className={styles.wordmark}>DirectorByte</span>
          </Link>
          <button onClick={() => setIsMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className={styles.menuLinks}>
          <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
          <a href="#pipeline" onClick={() => setIsMenuOpen(false)}>How it works</a>
          <Link to="/pricing" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
          <hr className={styles.divider} />
          <Button variant="primary" fullWidth onClick={() => { setIsMenuOpen(false); navigate('/signup'); }}>
            Get Started — Free
          </Button>
          <Button variant="ghost" fullWidth onClick={() => { setIsMenuOpen(false); navigate('/signin'); }}>
            Sign In
          </Button>
        </div>
      </div>
    </nav>
  );
}
