import React, { useState, useEffect } from 'react';
import { Search, Film, HelpCircle, User, Command, ArrowRight } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import { useUIStore } from '../../../store/ui.store';
import { cn } from '../../../utils/styles';
import styles from './GlobalSearch.module.css';

export function GlobalSearch() {
  const { activeModal, closeModal } = useUIStore();
  const isOpen = activeModal === 'global-search';
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useUIStore.getState().openModal('global-search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <Modal 
      open={isOpen} 
      onOpenChange={(open) => !open && closeModal()} 
      size="md"
      showClose={false}
      className={styles.modal}
    >
      <div className={styles.searchBox}>
        <Search className={styles.searchIcon} size={20} />
        <input 
          autoFocus
          className={styles.input}
          placeholder="Search projects, help, settings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className={styles.escBadge}>ESC</div>
      </div>

      <div className={styles.results}>
        {query.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.sectionLabel}>Recent Searches</p>
            <div className={styles.suggestions}>
              <div className={styles.suggestionItem}>
                <History size={16} /> <span>Cyberpunk Storyboard</span>
              </div>
              <div className={styles.suggestionItem}>
                <History size={16} /> <span>How to export 4K?</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.activeResults}>
            <p className={styles.sectionLabel}>Projects</p>
            <div className={styles.resultItem}>
              <Film size={18} className="text-brand-400" />
              <div className={styles.resultInfo}>
                <span className={styles.resultTitle}>{query} Exploration</span>
                <span className={styles.resultPath}>in My Projects</span>
              </div>
              <ArrowRight size={14} className={styles.goIcon} />
            </div>
            
            <p className={styles.sectionLabel}>Help Articles</p>
            <div className={styles.resultItem}>
              <HelpCircle size={18} className="text-info" />
              <div className={styles.resultInfo}>
                <span className={styles.resultTitle}>Understanding {query} workflow</span>
                <span className={styles.resultPath}>Documentation</span>
              </div>
              <ArrowRight size={14} className={styles.goIcon} />
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.hint}>
          <Command size={12} /> + <ArrowRight size={12} style={{ transform: 'rotate(90deg)' }} /> <span>to navigate</span>
        </div>
        <div className={styles.hint}>
          <span>⏎</span> <span>to select</span>
        </div>
      </div>
    </Modal>
  );
}

import { History } from 'lucide-react';
