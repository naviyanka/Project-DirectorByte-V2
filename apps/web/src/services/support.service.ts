export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  views: number;
  helpfulScore: number;
  updatedAt: string;
}

export interface SupportCategory {
  id: string;
  slug: string;
  title: string;
  icon: string;
  articleCount: number;
}

export const MOCK_CATEGORIES: SupportCategory[] = [
  { id: '1', slug: 'getting-started', title: 'Getting Started', icon: '🚀', articleCount: 12 },
  { id: '2', slug: 'api-keys', title: 'API Keys', icon: '🔑', articleCount: 8 },
  { id: '3', slug: 'billing', title: 'Billing & Plans', icon: '💳', articleCount: 15 },
  { id: '4', slug: 'studio', title: 'Studio Pipeline', icon: '🎬', articleCount: 24 },
  { id: '5', slug: 'troubleshooting', title: 'Troubleshooting', icon: '🛠️', articleCount: 10 },
  { id: '6', slug: 'account', title: 'Account Settings', icon: '👤', articleCount: 6 },
];

export const MOCK_ARTICLES: HelpArticle[] = [
  {
    id: 'a1',
    slug: 'setting-up-first-time',
    title: 'Setting up DirectorByte for the first time',
    excerpt: 'Learn how to connect your API keys and start your first project in under 5 minutes.',
    category: 'getting-started',
    views: 1240,
    helpfulScore: 94,
    updatedAt: '2025-05-13T10:00:00Z',
    content: `
      <h2>1. Create your account</h2>
      <p>Sign up using your email or Google account. Once verified, you'll be taken to the onboarding wizard.</p>
      
      <h2>2. Set up your API keys</h2>
      <p>Go to <strong>Settings > API Keys</strong> to connect your providers. We support Gemini, OpenAI, Flux, and more.</p>
      <div class="callout info">
        <strong>Pro Tip:</strong> Free plan users must provide their own keys. Creator plan users get managed keys by default.
      </div>
      
      <h2>3. Create your first project</h2>
      <p>Click the <strong>New Project</strong> button on your dashboard. Choose a name and your desired aspect ratio.</p>
      
      <pre><code>// Example project configuration
{
  "title": "My First Film",
  "ratio": "16:9",
  "fps": 24
}</code></pre>

      <h2>4. Export your film</h2>
      <p>Once your assembly is complete, click <strong>Export</strong> in the top right corner. Choose your resolution and format.</p>
    `
  },
  {
    id: 'a2',
    slug: 'how-to-connect-api-keys',
    title: 'How to add your own API keys',
    excerpt: 'Learn how to obtain and configure API keys for each studio module.',
    category: 'api-keys',
    views: 820,
    helpfulScore: 91,
    updatedAt: '2025-05-10T10:00:00Z'
  }
];

export const supportService = {
  getCategories: async () => MOCK_CATEGORIES,
  getArticlesByCategory: async (categorySlug: string) => 
    MOCK_ARTICLES.filter(a => a.category === categorySlug),
  getArticleBySlug: async (slug: string) => 
    MOCK_ARTICLES.find(a => a.slug === slug),
  searchArticles: async (query: string) => 
    MOCK_ARTICLES.filter(a => 
      a.title.toLowerCase().includes(query.toLowerCase()) || 
      a.excerpt.toLowerCase().includes(query.toLowerCase())
    ),
};
