import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, FileDown, Home, Loader2, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { allGuides, categories, findCategoryByGuide, findGuide } from "@/data/guides";
import { exportToPdf, exportToPptx, parseGuideHtml } from "@/lib/exportGuide";
import { useToast } from "@/hooks/use-toast";

const GuideViewer = () => {
  const { slug = "" } = useParams();
  const guide = useMemo(() => findGuide(slug), [slug]);
  const category = useMemo(() => findCategoryByGuide(slug), [slug]);
  const { toast } = useToast();
  const [busy, setBusy] = useState<null | "pptx" | "pdf">(null);

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

  const handleExport = async (kind: "pptx" | "pdf") => {
    if (busy) return;
    setBusy(kind);
    try {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error("HTML을 불러올 수 없습니다");
      const html = await res.text();
      const parsed = parseGuideHtml(html);
      if (parsed.sections.length === 0) {
        throw new Error("섹션을 찾을 수 없습니다");
      }
      const base = `${guide.title}-가이드`;
      if (kind === "pptx") {
        await exportToPptx(parsed, `${base}.pptx`);
      } else {
        exportToPdf(parsed, `${base}.pdf`);
      }
      toast({
        title: kind === "pptx" ? "PPT 다운로드 완료" : "PDF 다운로드 완료",
        description: `${parsed.sections.length}개 섹션을 슬라이드로 변환했습니다.`,
      });
    } catch (e) {
      toast({
        title: "내보내기 실패",
        description: e instanceof Error ? e.message : "알 수 없는 오류",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pptx")}
              disabled={!!busy}
              title="섹션 단위로 슬라이드를 만들어 PPT로 저장"
            >
              {busy === "pptx" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Presentation className="h-4 w-4 mr-1" />
              )}
              PPT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              disabled={!!busy}
              title="섹션 단위로 PDF 저장"
            >
              {busy === "pdf" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-1" />
              )}
              PDF
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" /> 새 탭
              </a>
            </Button>
          </div>
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