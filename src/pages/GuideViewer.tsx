import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { allGuides, categories, findCategoryByGuide, findGuide } from "@/data/guides";

const GuideViewer = () => {
  const { slug = "" } = useParams();
  const guide = useMemo(() => findGuide(slug), [slug]);
  const category = useMemo(() => findCategoryByGuide(slug), [slug]);

  const idx = allGuides.findIndex((g) => g.slug === slug);
  const prev = idx > 0 ? allGuides[idx - 1] : null;
  const next = idx >= 0 && idx < allGuides.length - 1 ? allGuides[idx + 1] : null;

  useEffect(() => {
    if (guide) {
      document.title = `${guide.title} 가이드 | AI 가이드 허브`;
      const desc = `${guide.title} — ${guide.subtitle}. 한국어 활용 가이드.`;
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", desc);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [guide]);

  if (!guide || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">가이드를 찾을 수 없습니다</h1>
          <Link to="/" className="text-primary underline">홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const fileUrl = `/guides/${encodeURIComponent(guide.file)}`;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container flex h-16 items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-1" /> 홈
            </Link>
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: `hsl(var(${category.colorVar}))` }}
            />
            <span className="text-sm text-muted-foreground truncate">{category.label}</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold truncate">{guide.title}</span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" /> 새 탭
            </a>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 border-r border-border overflow-y-auto bg-card/30">
          <div className="p-4 space-y-6">
            {categories.map((c) => (
              <div key={c.id}>
                <div className="flex items-center gap-2 mb-2 px-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(var(${c.colorVar}))` }} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.label}
                  </span>
                </div>
                <ul className="space-y-0.5">
                  {c.guides.map((g) => {
                    const active = g.slug === slug;
                    return (
                      <li key={g.slug}>
                        <Link
                          to={`/guide/${g.slug}`}
                          className={`block px-2 py-1.5 rounded-md text-sm transition-colors ${
                            active
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          }`}
                        >
                          {g.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Iframe */}
        <main className="flex-1 flex flex-col min-w-0">
          <iframe
            key={slug}
            src={fileUrl}
            title={`${guide.title} 가이드`}
            className="flex-1 w-full border-0 bg-white"
          />

          {/* Prev/Next */}
          <nav className="border-t border-border bg-card p-3 flex items-center justify-between gap-3">
            {prev ? (
              <Button variant="ghost" asChild className="max-w-[45%] justify-start">
                <Link to={`/guide/${prev.slug}`}>
                  <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
                  <span className="flex flex-col items-start min-w-0">
                    <span className="text-xs text-muted-foreground">이전</span>
                    <span className="truncate font-medium">{prev.title}</span>
                  </span>
                </Link>
              </Button>
            ) : <div />}
            {next ? (
              <Button variant="ghost" asChild className="max-w-[45%] justify-end">
                <Link to={`/guide/${next.slug}`}>
                  <span className="flex flex-col items-end min-w-0">
                    <span className="text-xs text-muted-foreground">다음</span>
                    <span className="truncate font-medium">{next.title}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 ml-2 shrink-0" />
                </Link>
              </Button>
            ) : <div />}
          </nav>
        </main>
      </div>
    </div>
  );
};

export default GuideViewer;