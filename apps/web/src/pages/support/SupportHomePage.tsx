import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, List, Activity, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Card, Input, Badge } from '../../design-system/components';
import { supportService, SupportCategory } from '../../services/support.service';
import { cn } from '../../utils/styles';
import styles from './SupportPage.module.css';

export function SupportHomePage() {
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supportService.getCategories().then(setCategories);
  }, []);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length > 2) {
      const results = await supportService.searchArticles(val);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className={cn(styles.container, 'animate-fade-in')}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Support Center</h1>
        <p className={styles.subtitle}>How can we help you today?</p>
        
        <div className={styles.searchWrapper}>
          <Input 
            type="search" 
            placeholder="Search for answers, guides, or tutorials..." 
            size="lg"
            fullWidth
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            className={styles.searchInput}
          />
          {searchResults.length > 0 && (
            <div className={styles.searchDropdown}>
              <div className="p-2 border-b border-surface-200 bg-surface-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-hint">Search Results for "{searchQuery}"</span>
              </div>
              {searchResults.map((result) => (
                <Link 
                  key={result.id} 
                  to={`/support/article/${result.slug}`}
                  className={styles.searchResultItem}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-brand-400 font-mono text-xs">DOC</div>
                    <span className="font-medium text-sm">{result.title}</span>
                  </div>
                  <Badge size="sm">{result.category}</Badge>
                </Link>
              ))}
              <Link to={`/support/search?q=${searchQuery}`} className={cn(styles.searchResultItem, styles.seeAll)}>
                <span>See all results for "{searchQuery}"</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className={styles.layout}>
        {/* Main Content */}
        <div className={styles.mainContent}>
          <section className="mb-12">
            <h2 className={styles.sectionTitle}>Browse by Category</h2>
            <div className={styles.categoryGrid}>
              {categories.map((cat) => (
                <Link key={cat.id} to={`/support/category/${cat.slug}`} className={styles.categoryCard}>
                  <div className={styles.categoryIcon}>{cat.icon}</div>
                  <h3 className="font-bold mb-1">{cat.title}</h3>
                  <p className="text-xs text-hint">{cat.articleCount} articles</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:border-brand-400 transition-colors cursor-pointer" onClick={() => navigate('/support/tickets')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-500">
                  <List size={24} />
                </div>
                <div>
                  <h3 className="font-bold">My Tickets</h3>
                  <p className="text-sm text-hint">View and track your open requests</p>
                </div>
                <div className="ml-auto bg-brand-500 text-white text-[10px] font-black px-2 py-1 rounded-full">2 OPEN</div>
              </div>
            </Card>

            <Card className="hover:border-brand-400 transition-colors cursor-pointer" onClick={() => navigate('/support/tickets/new')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center text-success-500">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="font-bold">Submit a Ticket</h3>
                  <p className="text-sm text-hint">Talk to our human support team</p>
                </div>
                <ArrowRight size={20} className="ml-auto text-surface-400" />
              </div>
            </Card>
          </section>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <Card header={<h3 className="font-bold text-sm">System Status</h3>}>
            <div className="space-y-6">
              <div className="flex items-center gap-2 p-3 bg-success-50 text-success-700 rounded-lg border border-success-200">
                <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                <span className="text-sm font-bold">All systems normal</span>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'API Server', status: 'Online' },
                  { name: 'Video Generation', status: 'Online' },
                  { name: 'Storage Cluster', status: 'Online' },
                  { name: 'Payment Gateway', status: 'Online' },
                ].map((s) => (
                  <div key={s.name} className="flex justify-between items-center text-xs">
                    <span className="text-secondary">{s.name}</span>
                    <span className="font-bold text-success-500">{s.status}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-surface-200 flex justify-between items-center">
                <span className="text-[10px] text-tertiary">Checked 2 min ago</span>
                <Button variant="ghost" size="sm" iconRight={<ExternalLink size={14} />} className="text-xs p-0 h-auto">Status Page</Button>
              </div>
            </div>
          </Card>

          <Card className="bg-brand-500 text-white border-none mt-6">
            <h3 className="font-bold mb-2">Need direct help?</h3>
            <p className="text-xs opacity-90 mb-6 leading-relaxed">Our support team is available 24/7 for Creator and Studio plan users.</p>
            <Button variant="primary" size="sm" fullWidth className="bg-white text-brand-600 hover:bg-surface-100 border-none">
              Live Chat
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
