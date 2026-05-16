import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, Clock, MessageSquare, Share2 } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system/components';
import { supportService, HelpArticle } from '../../services/support.service';
import { cn } from '../../utils/styles';
import styles from './SupportPage.module.css';

export function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [feedback, setFeedback] = useState<'UP' | 'DOWN' | null>(null);

  useEffect(() => {
    if (slug) {
      supportService.getArticleBySlug(slug).then(a => setArticle(a || null));
    }
  }, [slug]);

  if (!article) return null;

  return (
    <div className={cn(styles.container, 'animate-fade-in')}>
      <div className="max-w-4xl mx-auto">
        <Link 
          to={`/support/category/${article.category}`} 
          className="flex items-center gap-2 text-sm text-hint hover:text-brand-500 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          <span>Back to Category</span>
        </Link>

        <header className="mb-12 border-b border-surface-200 pb-12">
          <Badge variant="brand" className="mb-4 uppercase tracking-widest">{article.category}</Badge>
          <h1 className="text-4xl font-black mb-6 leading-tight">{article.title}</h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-hint">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Updated May 13, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-surface-300" />
              <span>5 min read</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-surface-300" />
              <span>{article.views.toLocaleString()} views</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-16">
          <article className={styles.articleBody}>
            <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
            
            <div className="mt-16 pt-12 border-t border-surface-200">
              <h3 className="text-xl font-bold mb-6">Was this article helpful?</h3>
              {feedback ? (
                <div className="p-6 bg-success-50 text-success-700 rounded-xl border border-success-100 flex items-center gap-3">
                  <span className="text-2xl">😊</span>
                  <p className="font-bold">Thanks for your feedback! We're glad it helped.</p>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button variant="outline" iconLeft={<ThumbsUp size={18} />} onClick={() => setFeedback('UP')}>
                    Yes, helpful
                  </Button>
                  <Button variant="outline" iconLeft={<ThumbsDown size={18} />} onClick={() => setFeedback('DOWN')}>
                    No, not helpful
                  </Button>
                </div>
              )}
            </div>
          </article>

          <aside className="space-y-8">
            <div className="p-6 bg-surface-100 rounded-xl border border-surface-200">
              <h4 className="font-bold text-sm mb-4">On this page</h4>
              <nav className="space-y-3">
                {['Introduction', 'Prerequisites', 'Step-by-step Guide', 'Troubleshooting'].map((item) => (
                  <button key={item} className="block text-xs text-secondary hover:text-brand-500 transition-colors text-left w-full">
                    {item}
                  </button>
                ))}
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm">Related Articles</h4>
              <ul className="space-y-4">
                {[
                  'How to connect your API keys',
                  'Understanding credit usage',
                  'Exporting your first film'
                ].map((item) => (
                  <li key={item}>
                    <Link to="#" className="text-xs text-brand-500 hover:underline leading-relaxed font-medium">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <Button variant="ghost" fullWidth iconLeft={<Share2 size={16} />} className="text-xs">Share Article</Button>
            <Button variant="ghost" fullWidth iconLeft={<MessageSquare size={16} />} className="text-xs">Submit Feedback</Button>
          </aside>
        </div>
      </div>
    </div>
  );
}
