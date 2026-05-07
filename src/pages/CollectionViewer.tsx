import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, Home, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collections } from "@/data/guides";

type Part = { slug: string; title: string; file: string };

const CollectionViewer = () => {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const collection = useMemo(() => collections.find((c) => c.id === id), [id]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Discover parts from the folder by parsing the index file
  useEffect(() => {
    if (!collection) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/${collection.folder}/${collection.indexFile}`);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const anchors = Array.from(doc.querySelectorAll("a[href$='.html']")) as HTMLAnchorElement[];
        const seen = new Set<string>();
        const list: Part[] = [];
        for (const a of anchors) {
          const href = a.getAttribute("href") || "";
          const file = href.split("/").pop() || "";
          if (!file || file === collection.indexFile || seen.has(file)) continue;
          seen.add(file);
          const title = (a.textContent || file.replace(/\.html$/, "")).trim();
          const slug = file.replace(/\.html$/, "");
          list.push({ slug, title, file });
        }
        if (!cancelled) {
          setParts(list);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collection]);

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">컬렉션을 찾을 수 없습니다</h1>
          <Link to="/" className="text-primary underline">홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const currentSlug = params.get("p") || collection.indexFile.replace(/\.html$/, "");
  const currentPart = parts.find((p) => p.slug === currentSlug);
  const currentFile = currentPart?.file || collection.indexFile;
  const fileUrl = `/${collection.folder}/${encodeURIComponent(currentFile)}`;

  const idx = parts.findIndex((p) => p.slug === currentSlug);
  const prev = idx > 0 ? parts[idx - 1] : null;
  const next = idx >= 0 && idx < parts.length - 1 ? parts[idx + 1] : null;

  useEffect(() => {
    document.title = `${currentPart?.title || collection.label} | ${collection.label}`;
  }, [collection, currentPart]);

  const goto = (slug: string) => {
    if (slug === collection.indexFile.replace(/\.html$/, "")) setParams({});
    else setParams({ p: slug });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container flex h-16 items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><Home className="h-4 w-4 mr-1" /> 홈</Link>
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: collection.color }} />
            <span className="text-sm text-muted-foreground truncate">{collection.label}</span>
            {currentPart && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="font-semibold truncate">{currentPart.title}</span>
              </>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setParams({})} title="목차로">
            <List className="h-4 w-4 mr-1" /> 목차
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" /> 새 탭
            </a>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:block w-72 shrink-0 border-r border-border overflow-y-auto bg-card/30">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: collection.color }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {collection.label}
              </span>
            </div>
            {!loaded && <div className="text-sm text-muted-foreground px-2">목차 로딩...</div>}
            <ul className="space-y-0.5">
              {parts.map((p) => {
                const active = p.slug === currentSlug;
                return (
                  <li key={p.slug}>
                    <button
                      onClick={() => goto(p.slug)}
                      className={`block w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                        active
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      {p.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <iframe
            key={currentFile}
            src={fileUrl}
            title={currentPart?.title || collection.label}
            className="flex-1 w-full border-0 bg-white"
          />
          <nav className="border-t border-border bg-card p-3 flex items-center justify-between gap-3">
            {prev ? (
              <Button variant="ghost" onClick={() => goto(prev.slug)} className="max-w-[45%] justify-start">
                <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start min-w-0">
                  <span className="text-xs text-muted-foreground">이전</span>
                  <span className="truncate font-medium">{prev.title}</span>
                </span>
              </Button>
            ) : <div />}
            {next ? (
              <Button variant="ghost" onClick={() => goto(next.slug)} className="max-w-[45%] justify-end">
                <span className="flex flex-col items-end min-w-0">
                  <span className="text-xs text-muted-foreground">다음</span>
                  <span className="truncate font-medium">{next.title}</span>
                </span>
                <ArrowRight className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            ) : <div />}
          </nav>
        </main>
      </div>
    </div>
  );
};

export default CollectionViewer;