import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Youtube, Disc as Discord } from 'lucide-react';
import styles from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <Link to="/" className={styles.logo}>
              <div className={styles.logoIcon}>🎬</div>
              <span className={styles.wordmark}>DirectorByte</span>
            </Link>
            <p className={styles.tagline}>
              Empowering the next generation of filmmakers with state-of-the-art AI tools.
            </p>
            <div className={styles.socials}>
              <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
              <a href="#" aria-label="YouTube"><Youtube size={20} /></a>
              <a href="#" aria-label="Discord"><Discord size={20} /></a>
            </div>
          </div>

          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Product</h4>
            <ul className={styles.linkList}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/home">Studio</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>

          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Company</h4>
            <ul className={styles.linkList}>
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
            </ul>
          </div>

          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Legal & Support</h4>
            <ul className={styles.linkList}>
              <li><Link to="/support">Help Center</Link></li>
              <li><Link to="/support/tickets/new">Contact</Link></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {currentYear} DirectorByte. All rights reserved.</p>
          <p className={styles.madeWith}>Made with AI ❤️</p>
        </div>
      </div>
    </footer>
  );
}
