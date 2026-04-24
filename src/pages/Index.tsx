import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { categories } from "@/data/guides";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>(categories[0].id);

  useEffect(() => {
    document.title = "AI 생산성 가이드 허브 | 카테고리별 도구 모음";
    const desc = "ChatGPT, Claude, Notion, Obsidian 등 AI · 생산성 도구를 카테고리별로 모은 한국어 가이드 허브.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        guides: c.guides.filter(
          (g) =>
            g.title.toLowerCase().includes(q) ||
            g.subtitle.toLowerCase().includes(q) ||
            c.label.toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.guides.length > 0);
  }, [query]);

  const scrollToCategory = (id: string) => {
    setActiveCat(id);
    const el = document.getElementById(`cat-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--gradient-hero)" }}>
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </span>
            <span>AI 가이드 허브</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => scrollToCategory(c.id)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeCat === c.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
              <Sparkles className="h-3 w-3" /> 한국어로 정리한 도구 가이드 모음
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              AI · 생산성 도구를
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-hero)" }}
              >
                카테고리별로 빠르게
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
              ChatGPT, Claude, Notion, Obsidian부터 이미지·영상 AI까지. 19개 도구 가이드를 그룹으로 모아 한 화면에서 탐색하고 바로 읽어볼 수 있습니다.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="도구 이름이나 카테고리 검색..."
                  className="pl-10 h-12 bg-card"
                />
              </div>
              <Button size="lg" className="h-12" onClick={() => scrollToCategory(categories[0].id)}>
                탐색 시작 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => scrollToCategory(c.id)}
                  className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-foreground/30 transition-colors"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: `hsl(var(${c.colorVar}))` }}
                  />
                  {c.label}
                  <span className="text-muted-foreground">{c.guides.length}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <main className="container py-12 md:py-16 space-y-20">
        {filtered.map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-24">
            <div className="flex items-end justify-between gap-4 mb-8 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: `hsl(var(${cat.colorVar}))` }}
                  />
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {cat.id}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">{cat.label}</h2>
                <p className="text-muted-foreground mt-2">{cat.description}</p>
              </div>
              <span className="text-sm text-muted-foreground hidden sm:block">{cat.guides.length}개 가이드</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.guides.map((g) => (
                <Link
                  key={g.slug}
                  to={`/guide/${g.slug}`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-foreground/30 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ backgroundColor: `hsl(var(${cat.colorVar}))` }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{g.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{g.subtitle}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            "{query}"에 해당하는 가이드가 없습니다.
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-12">
        <div className="container py-8 text-sm text-muted-foreground flex flex-wrap justify-between gap-4">
          <p>© AI 가이드 허브 — 한국어 도구 가이드 모음</p>
          <p>{categories.reduce((n, c) => n + c.guides.length, 0)}개의 가이드</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
