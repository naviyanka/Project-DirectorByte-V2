import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, FileText, ChevronRight, Eye, ThumbsUp } from 'lucide-react';
import { Button, Card, Input } from '../../design-system/components';
import { supportService, HelpArticle, MOCK_CATEGORIES } from '../../services/support.service';
import { cn } from '../../utils/styles';
import styles from './SupportPage.module.css';

export function CategoryPage() {
  const { slug } = useParams();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [category, setCategory] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (slug) {
      supportService.getArticlesByCategory(slug).then(setArticles);
      setCategory(MOCK_CATEGORIES.find(c => c.slug === slug));
    }
  }, [slug]);

  if (!category) return null;

  return (
    <div className={cn(styles.container, 'animate-fade-in')}>
      <div className="mb-8">
        <Link to="/support" className="flex items-center gap-2 text-sm text-hint hover:text-brand-500 transition-colors mb-4">
          <ArrowLeft size={16} />
          <span>Back to Support</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-4xl">{category.icon}</div>
          <div>
            <h1 className="text-3xl font-black">{category.title}</h1>
            <p className="text-sm text-hint">{category.articleCount} articles in this category</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl">
        <div className="mb-12">
          <Input 
            fullWidth 
            placeholder={`Search within ${category.title}...`} 
            leftIcon={<Search size={18} />}
          />
        </div>

        <div className="space-y-4">
          {articles.map((article) => (
            <Card 
              key={article.id} 
              className="group hover:border-brand-400 transition-colors cursor-pointer"
              onClick={() => navigate(`/support/article/${article.slug}`)}
            >
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-surface-100 rounded-lg flex items-center justify-center text-surface-400 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">{article.title}</h3>
                  <p className="text-sm text-secondary line-clamp-2 mb-4">{article.excerpt}</p>
                  
                  <div className="flex items-center gap-6 text-xs text-hint">
                    <div className="flex items-center gap-1.5">
                      <Eye size={14} />
                      <span>{article.views.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ThumbsUp size={14} />
                      <span>{article.helpfulScore}% helpful</span>
                    </div>
                    <span>Updated 3 days ago</span>
                  </div>
                </div>
                <ChevronRight className="self-center text-surface-300 group-hover:text-brand-500 transition-colors" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
