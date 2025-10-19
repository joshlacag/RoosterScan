import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, BookOpen, Eye } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type EducationalContent = {
  id: string;
  title: string;
  description: string;
  content_type: 'article' | 'video' | 'interactive_3d' | 'quiz';
  category: 'anatomy' | 'injury_prevention' | 'treatment' | 'breeding' | 'nutrition';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  content_text: string;
  estimated_read_time: number;
  tags: string[];
  view_count: number;
  created_at: string;
};

export default function ArticleReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<EducationalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const loadArticle = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/education/${id}`);
        if (!response.ok) throw new Error('Failed to load article');
        
        const result = await response.json();
        setArticle(result.data);
      } catch (error) {
        console.error('Error loading article:', error);
        toast.error('Failed to load article');
        navigate('/learn');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id, navigate]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
      setReadProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-muted';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'anatomy': return 'bg-blue-500/10 text-blue-700';
      case 'injury_prevention': return 'bg-green-500/10 text-green-700';
      case 'treatment': return 'bg-red-500/10 text-red-700';
      case 'breeding': return 'bg-purple-500/10 text-purple-700';
      case 'nutrition': return 'bg-orange-500/10 text-orange-700';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Article not found</p>
          <Button onClick={() => navigate('/learn')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Educational Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div 
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/learn')}
            className="-ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-xs sm:text-sm">Back to Educational Hub</span>
          </Button>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Article Header */}
        <header className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b">
          <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
            <Badge variant="outline" className={`${getCategoryColor(article.category)} text-xs`}>
              {article.category.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className={`${getDifficultyColor(article.difficulty_level)} text-xs`}>
              {article.difficulty_level}
            </Badge>
            <Badge variant="outline" className="capitalize text-xs">
              {article.content_type}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6">
            {article.description}
          </p>

          <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{article.estimated_read_time} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{article.view_count} views</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Article</span>
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        {/* Article Body */}
        <div className="prose prose-sm sm:prose-base prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl sm:text-3xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 text-foreground">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl sm:text-2xl font-semibold mt-5 sm:mt-6 mb-2 sm:mb-3 text-foreground">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg sm:text-xl font-semibold mt-4 mb-2 text-foreground">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-base leading-7 mb-4 text-foreground/90">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-2 mb-4 text-foreground/90">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground/90">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-base leading-7">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ),
            }}
          >
            {article.content_text}
          </ReactMarkdown>
        </div>

        {/* Article Footer */}
        <footer className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-muted-foreground">
              <p>Published on {new Date(article.created_at).toLocaleDateString()}</p>
            </div>
            <Button onClick={() => navigate('/learn')} size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">Back to Educational Hub</span>
            </Button>
          </div>
        </footer>
      </article>
    </div>
  );
}
