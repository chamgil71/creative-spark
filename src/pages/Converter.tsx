import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Upload, 
  Play, 
  Download, 
  FileText, 
  Loader2, 
  BookOpen, 
  Presentation, 
  SlidersHorizontal,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface StyleItem {
  label: string;
  brand: string;
}

interface ConverterProps {
  isStandalonePage?: boolean;
}

export default function Converter({ isStandalonePage = false }: ConverterProps) {
  const { toast } = useToast();


  
  // Markdown source and settings
  const [markdown, setMarkdown] = useState<string>(`---
title: 새 가이드 문서
subtitle: 숏코드를 편집하고 실시간 미리보기를 해보세요
style: custom-blue
---

# 🚀 새로운 기능 소개

이곳에 가이드 내용을 작성하세요.

## 📋 핵심 요약

| 구분 | 내용 |
| --- | --- |
| 단독 | 독립 html로 손쉽게 실행 가능 |
| 숏코드 | 다양한 시각화 컴포넌트 지원 |

---
<!-- slide -->
# 💡 숏코드 테스트

[editor-box]
### 🛠️ 개발 환경 설정
- **OS**: Windows / macOS / Linux 지원
- **Runtime**: Node.js v18 이상 권장
[/editor-box]
`);
  const [filename, setFilename] = useState("guide.md");
  
  // Style and Server files
  const [styles, setStyles] = useState<Record<string, StyleItem>>({});
  const [selectedStyle, setSelectedStyle] = useState("custom-blue");
  const [sourceFiles, setSourceFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Split View & Generation options
  const [previewMode, setPreviewMode] = useState<"html" | "presentation">("html");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [generatingPreview, setGeneratingPreview] = useState(false);
  
  // Final Save Options
  const [outputPath, setOutputPath] = useState("dist-pptx");
  const [saveOption, setSaveOption] = useState<"standalone" | "guideHub">("standalone");

  useEffect(() => {
    if (isStandalonePage) {
      setSaveOption("standalone");
    }
  }, [isStandalonePage]);

  const [targetFormats, setTargetFormats] = useState<string[]>(["html", "presentation", "pptx"]);
  const [options, setOptions] = useState({
    toc: true,
    noCover: false,
  });
  const [saving, setSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Theme Manager states
  const [showThemeManager, setShowThemeManager] = useState(false);
  const [editingThemeKey, setEditingThemeKey] = useState<string | null>(null);
  const [themeForm, setThemeForm] = useState({
    label: "",
    brand: "#2563FF",
    brandDark: "#1E71CE",
    brandDeep: "#0F478F",
    brandLight: "#F0F7FF",
    brandMid: "#C7CCFB",
    bg: "#F8F9FE",
    bgDark: "#2563FF",
    border: "#D8DCFB",
    webFont: "Pretendard, sans-serif",
    webFontTitle: "Pretendard-Bold, sans-serif",
    pptxFont: "Pretendard",
    pptxFontTitle: "Pretendard",
    pptxFontSubTitle: "Pretendard"
  });
  const [newThemeKey, setNewThemeKey] = useState("");

  // Save Style Changes Locally (to state)
  const handleAddOrEditTheme = () => {
    if (editingThemeKey) {
      // Edit existing
      setStyles(prev => ({
        ...prev,
        [editingThemeKey]: {
          ...themeForm
        }
      }));
      toast({
        title: "테마 수정 완료",
        description: `"${themeForm.label}" 테마가 로컬 상태에서 수정되었습니다. [서버에 최종 저장하기]를 눌러 반영하세요.`,
      });
      setEditingThemeKey(null);
    } else {
      // Add new
      const key = newThemeKey.trim().toLowerCase();
      if (!key) {
        toast({
          title: "입력 오류",
          description: "새 테마 키(ID)를 입력해 주세요.",
          variant: "destructive"
        });
        return;
      }
      if (styles[key]) {
        toast({
          title: "중복 오류",
          description: "이미 존재하는 테마 키(ID)입니다.",
          variant: "destructive"
        });
        return;
      }
      if (!themeForm.label.trim()) {
        toast({
          title: "입력 오류",
          description: "테마 한글명을 입력해 주세요.",
          variant: "destructive"
        });
        return;
      }
      setStyles(prev => ({
        ...prev,
        [key]: {
          ...themeForm
        }
      }));
      toast({
        title: "테마 추가 완료",
        description: `"${themeForm.label}" 테마가 로컬 상태에 추가되었습니다. [서버에 최종 저장하기]를 눌러 반영하세요.`,
      });
      setNewThemeKey("");
    }
    
    // Reset form
    setThemeForm({
      label: "",
      brand: "#2563FF",
      brandDark: "#1E71CE",
      brandDeep: "#0F478F",
      brandLight: "#F0F7FF",
      brandMid: "#C7CCFB",
      bg: "#F8F9FE",
      bgDark: "#2563FF",
      border: "#D8DCFB",
      webFont: "Pretendard, sans-serif",
      webFontTitle: "Pretendard-Bold, sans-serif",
      pptxFont: "Pretendard",
      pptxFontTitle: "Pretendard",
      pptxFontSubTitle: "Pretendard"
    });
  };

  // Delete theme from local state
  const handleDeleteTheme = (keyToDelete: string) => {
    if (keyToDelete === "custom-blue" || keyToDelete === "ai-chat") {
      toast({
        title: "삭제 불가능",
        description: "기본 테마는 삭제할 수 없습니다.",
        variant: "destructive"
      });
      return;
    }
    
    const newStyles = { ...styles };
    delete newStyles[keyToDelete];
    setStyles(newStyles);
    
    if (selectedStyle === keyToDelete) {
      setSelectedStyle("custom-blue");
    }
    
    toast({
      title: "테마 삭제 완료",
      description: `테마가 로컬 상태에서 삭제되었습니다. [서버에 최종 저장하기]를 눌러 반영하세요.`,
    });
  };

  // Persist updated styles object to config/styles.json
  const handleSaveStylesToServer = async () => {
    try {
      const res = await fetch("/api/save-styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styles }),
      });
      
      if (res.ok) {
        toast({
          title: "서버 저장 성공",
          description: "모든 테마 변경사항이 styles.json에 반영되었습니다.",
        });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to save styles");
      }
    } catch (err: any) {
      toast({
        title: "서버 저장 실패",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // Load styles and file list on mount
  useEffect(() => {
    fetchStyles();
    fetchFiles();
  }, []);

  // Fetch styles from backend
  const fetchStyles = async () => {
    try {
      const res = await fetch("/api/list-styles");
      if (res.ok) {
        const data = await res.json();
        setStyles(data);
      }
    } catch (err) {
      console.error("Failed to load styles:", err);
    }
  };

  // Fetch files list from backend
  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch("/api/list-files");
      if (res.ok) {
        const data = await res.json();
        setSourceFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to load source files:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Load selected server file content
  const handleLoadFile = async (filePath: string) => {
    try {
      const res = await fetch(`/api/load-file?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        setMarkdown(data.content);
        setFilename(filePath.split(/[/\\]/).pop() || "guide.md");
        
        // Extract style if present in frontmatter
        const styleMatch = data.content.match(/style:\s*([^\r\n]+)/);
        if (styleMatch && styleMatch[1]) {
          const matchedStyle = styleMatch[1].trim();
          setSelectedStyle(matchedStyle);
        }

        toast({
          title: "파일 불러오기 완료",
          description: `"${filePath}" 파일을 성공적으로 불러왔습니다.`,
        });

        // Trigger immediate preview render
        setTimeout(() => triggerPreview(data.content, previewMode, styleMatch?.[1]?.trim() || selectedStyle), 100);
      } else {
        throw new Error("Failed to load file");
      }
    } catch (err) {
      toast({
        title: "오류 발생",
        description: "파일을 불러오는 도중 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setMarkdown(text);
      setFilename(file.name);
      
      const styleMatch = text.match(/style:\s*([^\r\n]+)/);
      if (styleMatch && styleMatch[1]) {
        setSelectedStyle(styleMatch[1].trim());
      }

      toast({
        title: "파일 업로드 완료",
        description: `"${file.name}" 파일을 편집창으로 로드했습니다.`,
      });

      // Trigger immediate preview render
      setTimeout(() => triggerPreview(text, previewMode, styleMatch?.[1]?.trim() || selectedStyle), 100);
    };
    reader.readAsText(file);
  };

  // Trigger preview compilation
  const triggerPreview = async (mdContent = markdown, mode = previewMode, style = selectedStyle) => {
    if (!mdContent) {
      toast({
        title: "알림",
        description: "편집창에 마크다운 내용이 없습니다.",
      });
      return;
    }

    setGeneratingPreview(true);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: mdContent,
          mode,
          style,
        }),
      });

      if (res.ok) {
        const html = await res.text();
        setPreviewHtml(html);
        toast({
          title: "미리보기 반영 완료",
          description: "우측 미리보기 화면에 반영되었습니다.",
        });
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Preview generation failed");
      }
    } catch (err: any) {
      toast({
        title: "미리보기 반영 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Handle finalize and save
  const handleSaveAndGenerate = async () => {
    if (!markdown) {
      toast({
        title: "알림",
        description: "변환할 마크다운 내용이 없습니다.",
      });
      return;
    }

    if (targetFormats.length === 0) {
      toast({
        title: "알림",
        description: "최소 한 개 이상의 변환 포맷을 선택해 주세요.",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/save-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown,
          filename,
          outputPath,
          saveOption,
          formats: targetFormats,
          style: selectedStyle,
          options,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        toast({
          title: "변환 및 로컬 저장 완료",
          description: result.message,
          duration: 6000,
        });
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Save & generate failed");
      }
    } catch (err: any) {
      toast({
        title: "저장 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle formats selection
  const handleFormatToggle = (format: string) => {
    if (targetFormats.includes(format)) {
      setTargetFormats(targetFormats.filter(f => f !== format));
    } else {
      setTargetFormats([...targetFormats, format]);
    }
  };

  // Initial preview render on load
  useEffect(() => {
    if (markdown) {
      triggerPreview(markdown, previewMode, selectedStyle);
    }
  }, [previewMode]);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-background text-foreground relative">
      {/* 1. Header Bar */}
      <header className="h-14 border-b border-border bg-card/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          {!isStandalonePage && (
            <>
              <Button variant="ghost" size="sm" asChild className="h-8">
                <a href="/">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>메인 홈</span>
                </a>
              </Button>
              <div className="h-4 w-px bg-border" />
            </>
          )}
          <div className="flex items-center gap-2 font-bold text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            <span>독립형 가이드 변환 & 에디터</span>
          </div>
        </div>

        {/* Server Files Loader & Local Upload in Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="server-file-select" className="text-xs text-muted-foreground whitespace-nowrap">서버 문서 열기:</Label>
            <Select onValueChange={handleLoadFile}>
              <SelectTrigger id="server-file-select" className="h-8 w-48 text-xs">
                <SelectValue placeholder="문서 선택" />
              </SelectTrigger>
              <SelectContent>
                {sourceFiles.map((file) => (
                  <SelectItem key={file} value={file} className="text-xs">
                    {file}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative h-8 flex items-center bg-muted/60 hover:bg-muted border border-input rounded-md px-3 cursor-pointer text-xs transition-colors">
            <input 
              type="file" 
              accept=".md" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
            <Upload className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <span>로컬 파일 가져오기</span>
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Theme Selector */}
          <div className="flex items-center gap-2">
            <Label htmlFor="top-style-select" className="text-xs text-muted-foreground whitespace-nowrap">테마:</Label>
            <Select value={selectedStyle} onValueChange={(val) => {
              setSelectedStyle(val);
              // Auto update style in markdown frontmatter if exists
              setMarkdown(prev => {
                if (prev.includes("style:")) {
                  return prev.replace(/style:\s*[^\r\n]+/, `style: ${val}`);
                }
                return prev;
              });
            }}>
              <SelectTrigger id="top-style-select" className="h-8 w-40 text-xs">
                <SelectValue placeholder="스타일 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(styles).map(([key, value]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="w-2.5 h-2.5 rounded border inline-block" 
                        style={{ backgroundColor: value.brand || "#e2e8f0" }}
                      />
                      <span>{value.label || key}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowThemeManager(!showThemeManager)}
              className="h-8 text-xs gap-1"
            >
              🎨 테마 설정
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="h-8 text-xs gap-1"
            >
              <a href="/showcase/showcase.html" target="_blank" rel="noopener noreferrer">
                📖 숏코드 가이드
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Main Work Area: Split Pane */}
      <div className="flex-1 min-h-0 w-full">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* Left Panel: Editor & Settings */}
          <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col h-full min-h-0 bg-card">
            {/* Left Top: Editor Area */}
            <div className="flex-1 min-h-0 flex flex-col border-b border-border">
              {/* Editor Toolbar */}
              <div className="h-10 border-b border-border/80 bg-muted/30 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2 flex-1 mr-4">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="h-7 max-w-[200px] text-xs font-mono py-0.5 px-2 bg-background border-input/60 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="파일명.md"
                  />
                  <span className="text-[10px] text-muted-foreground">(저장 파일명)</span>
                </div>
                
                <Button 
                  onClick={() => triggerPreview(markdown, previewMode, selectedStyle)}
                  disabled={generatingPreview}
                  size="sm"
                  className="h-7 text-xs bg-primary hover:bg-primary/95 text-primary-foreground gap-1.5"
                >
                  {generatingPreview ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3 fill-current" />
                  )}
                  <span>미리보기 반영 (확인)</span>
                </Button>
              </div>

              {/* Textarea Editor */}
              <div className="flex-grow min-h-0 relative">
                <Textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  className="w-full h-full font-mono text-sm p-4 resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none overflow-y-auto leading-relaxed"
                  placeholder="여기에 마크다운 코드를 작성하거나 숏코드를 편집하세요..."
                />
              </div>
            </div>

            {/* Left Bottom: Save & Build Option Panel */}
            <div className="p-4 bg-muted/30 border-t border-border/80 flex flex-col gap-3 shrink-0">
              <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>확정 생성 및 로컬 저장 옵션</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Save Location Options */}
                {!isStandalonePage ? (
                  <div className="space-y-2 border-r border-border/60 pr-4 flex flex-col justify-between">
                    <div>
                      <Label className="text-xs font-semibold text-foreground">저장 위치 설정</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Button
                          type="button"
                          variant={saveOption === "standalone" ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs flex-1 font-semibold"
                          onClick={() => setSaveOption("standalone")}
                        >
                          단독 파일 생성
                        </Button>
                        <Button
                          type="button"
                          variant={saveOption === "guideHub" ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs flex-1 font-semibold"
                          onClick={() => setSaveOption("guideHub")}
                        >
                          가이드 허브 추가
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      {saveOption === "guideHub" 
                        ? "md_src/guides에 원본 저장 후 전체 허브 빌드를 돌려 가이드 목록 인덱스를 즉시 갱신합니다." 
                        : "가이드 문서에 포함하지 않고, 지정한 출력 폴더에 직접 단독 파일로 저장합니다."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 border-r border-border/60 pr-4 flex flex-col justify-center">
                    <Label className="text-xs font-semibold text-foreground">저장 방식</Label>
                    <p className="text-xs text-muted-foreground leading-normal mt-1">
                      지정된 출력 폴더에 마크다운에서 변환된 포맷(HTML, PPTX 등)의 단독 파일들을 직접 저장합니다.
                    </p>
                  </div>
                )}

                {/* Formats and Output Path */}
                <div className="space-y-2.5">
                  <div className="flex flex-col gap-1.2">
                    <Label htmlFor="output-path-input" className="text-xs font-semibold">출력 폴더 지정</Label>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Input
                        id="output-path-input"
                        value={outputPath}
                        onChange={(e) => setOutputPath(e.target.value)}
                        placeholder="예: dist-pptx"
                        className="h-8 text-xs py-0.5 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-semibold">생성 파일 선택</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                        <Checkbox 
                          checked={targetFormats.includes("html")} 
                          onCheckedChange={() => handleFormatToggle("html")}
                          className="h-3.5 w-3.5"
                        />
                        <span>HTML</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                        <Checkbox 
                          checked={targetFormats.includes("presentation")} 
                          onCheckedChange={() => handleFormatToggle("presentation")}
                          className="h-3.5 w-3.5"
                        />
                        <span>횡HTML</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                        <Checkbox 
                          checked={targetFormats.includes("pptx")} 
                          onCheckedChange={() => handleFormatToggle("pptx")}
                          className="h-3.5 w-3.5"
                        />
                        <span>PPTX</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action and Detail Options Row */}
              <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-1">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                    <Checkbox 
                      id="opt-toc"
                      checked={options.toc} 
                      onCheckedChange={(val) => setOptions(prev => ({ ...prev, toc: !!val }))}
                      className="h-3.5 w-3.5"
                    />
                    <span className="font-semibold text-[11px]">목차(TOC) 생성</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                    <Checkbox 
                      id="opt-cover"
                      checked={!options.noCover} 
                      onCheckedChange={(val) => setOptions(prev => ({ ...prev, noCover: !val }))}
                      className="h-3.5 w-3.5"
                    />
                    <span className="font-semibold text-[11px]">PPTX 표지 포함</span>
                  </label>
                </div>

                <Button
                  onClick={handleSaveAndGenerate}
                  disabled={saving}
                  className="h-9 px-6 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>선택 파일 확정 생성 및 로컬 저장</span>
                </Button>
              </div>
            </div>
          </ResizablePanel>

          {/* Resizable Splitter Handle */}
          <ResizableHandle withHandle />

          {/* Right Panel: Live Preview */}
          <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col h-full min-h-0 bg-muted/20">
            {/* Preview Toolbar */}
            <div className="h-10 border-b border-border/80 bg-muted/40 flex items-center justify-between px-4 shrink-0">
              {/* Preview mode selection */}
              <div className="flex items-center gap-1.5 bg-background border rounded-lg p-0.5">
                <Button
                  variant={previewMode === "html" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-3 text-[11px] font-semibold"
                  onClick={() => setPreviewMode("html")}
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1 text-primary" />
                  가이드 (A4)
                </Button>
                <Button
                  variant={previewMode === "presentation" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-3 text-[11px] font-semibold"
                  onClick={() => setPreviewMode("presentation")}
                >
                  <Presentation className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  슬라이드 (16:9)
                </Button>
              </div>

              {/* Viewport size controllers */}
              <div className="flex items-center gap-1 bg-background border rounded-lg p-0.5">
                <Button
                  variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-[11px]"
                  onClick={() => setPreviewDevice("desktop")}
                >
                  <Monitor className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  데스크탑
                </Button>
                <Button
                  variant={previewDevice === "tablet" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-[11px]"
                  onClick={() => setPreviewDevice("tablet")}
                >
                  <Tablet className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  태블릿
                </Button>
                <Button
                  variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-[11px]"
                  onClick={() => setPreviewDevice("mobile")}
                >
                  <Smartphone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  모바일
                </Button>
              </div>

              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-foreground" 
                  onClick={() => triggerPreview(markdown, previewMode, selectedStyle)}
                  disabled={generatingPreview}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${generatingPreview ? "animate-spin" : ""}`} />
                </Button>
                <span className="text-[10px] text-muted-foreground font-mono uppercase">
                  {previewMode === "html" ? "A4" : "16:9"}
                </span>
              </div>
            </div>

            {/* Preview Frame Container */}
            <div className="flex-grow flex-1 min-h-0 p-4 flex items-center justify-center bg-muted/10 overflow-hidden">
              <div 
                className="bg-white rounded-lg shadow-xl border overflow-hidden transition-all duration-300 relative flex items-center justify-center"
                style={{
                  width: previewDevice === "desktop" ? "100%" : previewDevice === "tablet" ? "768px" : "375px",
                  maxWidth: "100%",
                  height: "100%",
                  maxHeight: "100%",
                  aspectRatio: previewMode === "presentation" ? "16 / 9" : "auto",
                }}
              >
                {generatingPreview && !previewHtml && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                {previewHtml ? (
                  <iframe
                    title="Markdown Preview Frame"
                    srcDoc={previewHtml}
                    className="w-full h-full border-0 bg-white"
                    sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
                  />
                ) : (
                  <div className="flex-grow flex-1 flex flex-col items-center justify-center text-muted-foreground text-xs p-6 text-center gap-2">
                    <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-1" />
                    <p className="font-semibold">미리보기가 준비되지 않았습니다.</p>
                    <p className="text-[11px]">왼쪽 편집기에서 내용을 수정한 후 [미리보기 반영 (확인)] 버튼을 눌러주세요.</p>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Right Sliding Panel (Theme Manager) */}
      {showThemeManager && (
        <div className="absolute inset-y-0 right-0 w-[550px] bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-all duration-300 animate-in slide-in-from-right">
          {/* Header */}
          <div className="h-14 border-b border-border px-6 flex items-center justify-between bg-muted/20 shrink-0">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>🎨 디자인 테마 매니저</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setShowThemeManager(false);
                setEditingThemeKey(null);
              }}
            >
              닫기
            </Button>
          </div>
          
          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Add or Edit Form */}
            <div className="bg-muted/30 border rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-foreground">
                {editingThemeKey ? `✏️ 테마 수정 [ ${editingThemeKey} ]` : "➕ 새 테마 추가"}
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                {!editingThemeKey && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground">테마 ID (영문)</Label>
                    <Input 
                      value={newThemeKey}
                      onChange={(e) => setNewThemeKey(e.target.value)}
                      placeholder="예: custom-green"
                      className="h-7 text-xs py-0.5 px-2 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                )}
                <div className={`flex flex-col gap-1 ${editingThemeKey ? "col-span-2" : ""}`}>
                  <Label className="text-[10px] font-semibold text-muted-foreground">테마 한글명</Label>
                  <Input 
                    value={themeForm.label}
                    onChange={(e) => setThemeForm(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="예: 페이퍼로지 그린"
                    className="h-7 text-xs py-0.5 px-2 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Color pickers */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-muted-foreground">테마 색상 팔레트</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[9px] text-muted-foreground">메인 (Brand)</Label>
                    <div className="flex items-center gap-1">
                      <input 
                        type="color" 
                        value={themeForm.brand} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, brand: e.target.value }))} 
                        className="w-5 h-5 rounded p-0 border border-input cursor-pointer shrink-0"
                      />
                      <Input 
                        value={themeForm.brand} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, brand: e.target.value }))}
                        className="h-6 text-[10px] py-0.5 px-1 font-mono shrink-0 flex-1 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[9px] text-muted-foreground">어두운바 (bgDark)</Label>
                    <div className="flex items-center gap-1">
                      <input 
                        type="color" 
                        value={themeForm.bgDark} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, bgDark: e.target.value }))} 
                        className="w-5 h-5 rounded p-0 border border-input cursor-pointer shrink-0"
                      />
                      <Input 
                        value={themeForm.bgDark} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, bgDark: e.target.value }))}
                        className="h-6 text-[10px] py-0.5 px-1 font-mono shrink-0 flex-1 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[9px] text-muted-foreground">서브 진함 (Dark)</Label>
                    <div className="flex items-center gap-1">
                      <input 
                        type="color" 
                        value={themeForm.brandDark} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, brandDark: e.target.value }))} 
                        className="w-5 h-5 rounded p-0 border border-input cursor-pointer shrink-0"
                      />
                      <Input 
                        value={themeForm.brandDark} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, brandDark: e.target.value }))}
                        className="h-6 text-[10px] py-0.5 px-1 font-mono shrink-0 flex-1 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[9px] text-muted-foreground">서브 더진함 (Deep)</Label>
                    <div className="flex items-center gap-1">
                      <input 
                        type="color" 
                        value={themeForm.brandDeep} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, brandDeep: e.target.value }))} 
                        className="w-5 h-5 rounded p-0 border border-input cursor-pointer shrink-0"
                      />
                      <Input 
                        value={themeForm.brandDeep} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, brandDeep: e.target.value }))}
                        className="h-6 text-[10px] py-0.5 px-1 font-mono shrink-0 flex-1 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[9px] text-muted-foreground">강조 연함 (Light)</Label>
                    <div className="flex items-center gap-1">
                      <input 
                        type="color" 
                        value={themeForm.brandLight} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, brandLight: e.target.value }))} 
                        className="w-5 h-5 rounded p-0 border border-input cursor-pointer shrink-0"
                      />
                      <Input 
                        value={themeForm.brandLight} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, brandLight: e.target.value }))}
                        className="h-6 text-[10px] py-0.5 px-1 font-mono shrink-0 flex-1 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[9px] text-muted-foreground">강조 중간 (Mid)</Label>
                    <div className="flex items-center gap-1">
                      <input 
                        type="color" 
                        value={themeForm.brandMid} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, brandMid: e.target.value }))} 
                        className="w-5 h-5 rounded p-0 border border-input cursor-pointer shrink-0"
                      />
                      <Input 
                        value={themeForm.brandMid} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, brandMid: e.target.value }))}
                        className="h-6 text-[10px] py-0.5 px-1 font-mono shrink-0 flex-1 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[9px] text-muted-foreground">배경색 (bg)</Label>
                    <div className="flex items-center gap-1">
                      <input 
                        type="color" 
                        value={themeForm.bg} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, bg: e.target.value }))} 
                        className="w-5 h-5 rounded p-0 border border-input cursor-pointer shrink-0"
                      />
                      <Input 
                        value={themeForm.bg} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, bg: e.target.value }))}
                        className="h-6 text-[10px] py-0.5 px-1 font-mono shrink-0 flex-1 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[9px] text-muted-foreground">테두리 (border)</Label>
                    <div className="flex items-center gap-1">
                      <input 
                        type="color" 
                        value={themeForm.border} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, border: e.target.value }))} 
                        className="w-5 h-5 rounded p-0 border border-input cursor-pointer shrink-0"
                      />
                      <Input 
                        value={themeForm.border} 
                        onChange={(e) => setThemeForm(prev => ({ ...prev, border: e.target.value }))}
                        className="h-6 text-[10px] py-0.5 px-1 font-mono shrink-0 flex-1 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fonts config */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Web 본문 폰트</Label>
                  <Input 
                    value={themeForm.webFont}
                    onChange={(e) => setThemeForm(prev => ({ ...prev, webFont: e.target.value }))}
                    placeholder="예: Pretendard, sans-serif"
                    className="h-7 text-xs py-0.5 px-2 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Web 제목 폰트</Label>
                  <Input 
                    value={themeForm.webFontTitle}
                    onChange={(e) => setThemeForm(prev => ({ ...prev, webFontTitle: e.target.value }))}
                    placeholder="예: Pretendard-Bold, sans-serif"
                    className="h-7 text-xs py-0.5 px-2 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-[9px] font-semibold text-muted-foreground">PPTX 본문 폰트</Label>
                  <Input 
                    value={themeForm.pptxFont}
                    onChange={(e) => setThemeForm(prev => ({ ...prev, pptxFont: e.target.value }))}
                    placeholder="예: Pretendard"
                    className="h-7 text-xs py-0.5 px-2 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[9px] font-semibold text-muted-foreground">PPTX 제목 폰트</Label>
                  <Input 
                    value={themeForm.pptxFontTitle}
                    onChange={(e) => setThemeForm(prev => ({ ...prev, pptxFontTitle: e.target.value }))}
                    placeholder="예: Pretendard"
                    className="h-7 text-xs py-0.5 px-2 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[9px] font-semibold text-muted-foreground">PPTX 부제목 폰트</Label>
                  <Input 
                    value={themeForm.pptxFontSubTitle}
                    onChange={(e) => setThemeForm(prev => ({ ...prev, pptxFontSubTitle: e.target.value }))}
                    placeholder="예: Pretendard"
                    className="h-7 text-xs py-0.5 px-2 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {editingThemeKey && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs px-3"
                    onClick={() => {
                      setEditingThemeKey(null);
                      setThemeForm({
                        label: "",
                        brand: "#2563FF",
                        brandDark: "#1E71CE",
                        brandDeep: "#0F478F",
                        brandLight: "#F0F7FF",
                        brandMid: "#C7CCFB",
                        bg: "#F8F9FE",
                        bgDark: "#2563FF",
                        border: "#D8DCFB",
                        webFont: "Pretendard, sans-serif",
                        webFontTitle: "Pretendard-Bold, sans-serif",
                        pptxFont: "Pretendard",
                        pptxFontTitle: "Pretendard",
                        pptxFontSubTitle: "Pretendard"
                      });
                    }}
                  >
                    취소
                  </Button>
                )}
                <Button 
                  type="button" 
                  size="sm" 
                  className="h-7 text-xs px-4 bg-primary text-primary-foreground font-semibold"
                  onClick={handleAddOrEditTheme}
                >
                  {editingThemeKey ? "수정 반영" : "새 테마 추가"}
                </Button>
              </div>
            </div>

            {/* Themes List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground">📋 등록된 디자인 테마 목록</h4>
              <div className="border rounded-lg overflow-hidden divide-y">
                {Object.entries(styles).map(([key, style]: [string, any]) => (
                  <div key={key} className="p-3 hover:bg-muted/10 transition-colors flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{style.label || key}</span>
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {key}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[10px] text-primary px-1.5"
                          onClick={() => {
                            setEditingThemeKey(key);
                            setThemeForm({
                              label: style.label || "",
                              brand: style.brand || "#2563FF",
                              brandDark: style.brandDark || "#1E71CE",
                              brandDeep: style.brandDeep || "#0F478F",
                              brandLight: style.brandLight || "#F0F7FF",
                              brandMid: style.brandMid || "#C7CCFB",
                              bg: style.bg || "#F8F9FE",
                              bgDark: style.bgDark || style.brand || "#2563FF",
                              border: style.border || "#D8DCFB",
                              webFont: style.webFont || "Pretendard, sans-serif",
                              webFontTitle: style.webFontTitle || "Pretendard-Bold, sans-serif",
                              pptxFont: style.pptxFont || "Pretendard",
                              pptxFontTitle: style.pptxFontTitle || "Pretendard",
                              pptxFontSubTitle: style.pptxFontSubTitle || "Pretendard"
                            });
                          }}
                        >
                          수정
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[10px] text-destructive px-1.5"
                          onClick={() => handleDeleteTheme(key)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                    
                    {/* Color swatch row */}
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col items-center gap-0.5">
                          <span 
                            className="w-5 h-5 rounded border shadow-sm" 
                            style={{ backgroundColor: style.brand }} 
                            title={`메인: ${style.brand}`}
                          />
                          <span className="text-[8px] text-muted-foreground">메인</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <span 
                            className="w-5 h-5 rounded border shadow-sm" 
                            style={{ backgroundColor: style.bgDark || style.brand }} 
                            title={`어두운바: ${style.bgDark || style.brand}`}
                          />
                          <span className="text-[8px] text-muted-foreground">어두운바</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <span 
                            className="w-5 h-5 rounded border shadow-sm" 
                            style={{ backgroundColor: style.brandDark }} 
                            title={`서브Dark: ${style.brandDark}`}
                          />
                          <span className="text-[8px] text-muted-foreground">Dark</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <span 
                            className="w-5 h-5 rounded border shadow-sm" 
                            style={{ backgroundColor: style.brandDeep }} 
                            title={`서브Deep: ${style.brandDeep}`}
                          />
                          <span className="text-[8px] text-muted-foreground">Deep</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <span 
                            className="w-5 h-5 rounded border shadow-sm" 
                            style={{ backgroundColor: style.brandLight }} 
                            title={`강조Light: ${style.brandLight}`}
                          />
                          <span className="text-[8px] text-muted-foreground">Light</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <span 
                            className="w-5 h-5 rounded border shadow-sm" 
                            style={{ backgroundColor: style.brandMid }} 
                            title={`강조Mid: ${style.brandMid}`}
                          />
                          <span className="text-[8px] text-muted-foreground">Mid</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <span 
                            className="w-5 h-5 rounded border shadow-sm" 
                            style={{ backgroundColor: style.bg }} 
                            title={`배경: ${style.bg}`}
                          />
                          <span className="text-[8px] text-muted-foreground">배경</span>
                        </div>
                      </div>

                      {/* Font summary */}
                      <div className="text-[9px] text-muted-foreground text-right">
                        <div>Web: <span className="font-mono">{style.webFont?.split(',')[0]}</span></div>
                        <div>PPTX: <span className="font-mono">{style.pptxFont}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/20 flex gap-2 justify-end shrink-0">
            <Button variant="outline" size="sm" className="text-xs" onClick={fetchStyles}>
              서버에서 새로고침
            </Button>
            <Button size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={handleSaveStylesToServer}>
              서버에 최종 저장하기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
