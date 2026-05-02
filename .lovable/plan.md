## 목표

PPT 내보내기 시 현재처럼 720px씩 기계적으로 자르는 방식 대신, **각 `<section>`(= H2 단위)을 한 장 또는 여러 장의 슬라이드로 자연스럽게 분할**합니다. 카드/표 중간이 잘리는 문제를 없애고, 슬라이드마다 의미 단위로 묶이게 합니다.

## 분할 전략

가이드 HTML이 모두 다음 구조로 통일되어 있다는 점을 활용합니다:

```text
<section class="hero">…</section>
<section class="section" id="…">…</section>   ← H2 한 개 = 한 섹션
<section class="section" id="…">…</section>
…
<section class="done-section">…</section>
```

각 `<section>`을 개별적으로 캡처하여 슬라이드에 배치합니다.

### 섹션 → 슬라이드 매핑 규칙

1. **표지 슬라이드** (지금처럼 docTitle + "AI 가이드 허브") — 유지
2. **`.hero` 섹션** → 1장 (보통 짧음)
3. **`.section` 각각** → 섹션 높이에 따라:
   - 7.5인치(720px) 이하: **1장에 통째로**
   - 초과: **자식 블록(`.section-inner` 내부 카드/표/단락) 단위로 묶어** N장으로 분할
     - 누적 높이가 720px을 넘기 직전까지 묶고, 다음 블록부터 새 슬라이드
     - 단일 블록이 720px보다 크면 그 블록만 비례 축소(스케일 다운)하여 한 장에 담음
4. **`.done-section`** → 1장 (마무리)
5. 각 슬라이드 우하단에 `현재/전체` 페이지 번호 (지금과 동일)

### 캡처 방식

- 전체를 한 번에 `html2canvas`로 캡처한 뒤, 각 섹션의 `offsetTop` / `offsetHeight`로 잘라냄 (지금 코드 흐름 재사용)
- 폭은 1280px 고정(16:9), 슬라이드 비율 13.333 × 7.5 인치 그대로
- 섹션 높이 < 720px이면 슬라이드 상단에 배치하고 아래 여백은 흰색
- 섹션 높이 > 720px이면 자식 블록 경계에서 자르므로, 카드·표·코드블록이 절대 중간에 잘리지 않음

## 변경 파일

**`src/lib/exportGuide.ts`** — `exportIframeToPptx` 함수만 수정

핵심 로직 변경 (의사코드):

```text
1. 전체 body를 1280px 폭으로 html2canvas 캡처 → 큰 canvas 확보
2. iframe doc에서 분할 단위 노드 수집:
     nodes = [hero, ...sections, done-section]
3. 각 노드에 대해:
     top = node.offsetTop, h = node.offsetHeight
     if h <= 720:
         그대로 1장 슬라이드 (canvas의 [top, top+h] 영역 잘라 흰 배경 위에 얹기)
     else:
         // 섹션 내부 자식(.section-inner > *) 단위로 그루핑
         children = querySelectorAll('.section-inner > *') (없으면 직접 자식)
         그리디 패킹: 누적 720px 넘기 직전까지 한 슬라이드에 묶기
         (단일 블록 > 720px이면 비례 축소)
4. 마지막에 페이지 번호 N/Total 표기
```

## 사용자 영향

- `printGuideIframe`(PDF)는 변경 없음
- PPT 파일 크기는 조금 늘 수 있음(슬라이드 수 증가). 대신 카드·표·코드블록이 깨끗하게 한 슬라이드 안에 들어감
- 섹션이 짧으면 슬라이드 하단 여백이 생김 — 의도된 동작

## 검증 방법

배포 후 `/guide/chatgpt`, `/guide/github`(섹션 구조가 가장 표준적인 가이드)에서 PPT 내보내기 → 슬라이드별로 카드/표가 잘리지 않고 섹션 단위로 묶이는지 확인.

승인해주시면 바로 구현합니다.