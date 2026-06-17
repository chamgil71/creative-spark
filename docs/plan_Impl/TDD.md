# [상세 테스트 사양서] 테스트 및 정합성 검증 시나리오

본 문서는 컴파일러 변환 엔진, 인덱스 동기화기, 그리고 배포 런타임의 안전성을 검증하기 위한 정밀 테스트 및 TDD 가이드 문서입니다.

---

## 1. 단위 테스트 (Unit Tests) 검증 명세

### A. 단독 화살표 세퍼레이터 파서 검증
* **목적**: 마크다운 번역기가 단독으로 기입된 `↓` / `→` 기호 행을 인식해 애니메이션 효과가 가미된 `.flow-arrow-separator` 로 안전하게 파싱 및 치환하는가 확인.
* **테스트 코드 명세**:
  ```javascript
  import { parseMarkdownToSlides } from '../scripts/build-presentation.mjs';
  import { describe, it, expect } from 'vitest';

  describe('Flow Arrow Separator Parse Unit Test', () => {
    it('should replace standalone arrow with a separator element', () => {
      const md = "Slide A\n\n↓\n\nSlide B";
      const html = parseMarkdownToSlides(md);
      expect(html).toContain('class="flow-arrow-separator"');
      expect(html).toContain('↓');
    });
  });
  ```

### B. 표(Table) 짝수행 얼룩말 무늬 클래스 획득 테스트
* **목적**: 렌더링된 HTML 테이블 내의 짝수 번째 데이터 레코드 `<tr>` 태그가 `alt-row` CSS 클래스를 정상적으로 부착하는지 검사.
* **테스트 코드 명세**:
  ```javascript
  import { renderTableComponent } from '../scripts/build-guide.mjs';
  import { describe, it, expect } from 'vitest';

  describe('Zebra Stripe Table Class Binding Test', () => {
    it('should bind alt-row class to even tbody rows', () => {
      const mockTableToken = {
        rows: [
          ["Header A", "Header B"],
          ["Row 1 Col 1", "Row 1 Col 2"],
          ["Row 2 Col 1", "Row 2 Col 2"] // 짝수 행
        ]
      };
      const html = renderTableComponent(mockTableToken);
      expect(html).toContain('<tr class="alt-row"><td>Row 2 Col 1</td>');
    });
  });
  ```

---

## 2. 통합 파이프라인 정합성 검증 (Integration Tests)

### A. 인덱스 목록 동기화 검사 (`sync-guides-index.mjs`)
* **목적**: 신규 마크다운 문서를 추가한 뒤 동기화 스크립트를 기동했을 때, 기존 메타데이터의 정합성을 훼손하지 않고 리스트 끝자락에 신규 항목이 실시간 색인되는지 확인.
* **검증 절차**:
  1. `md_src/guides/test-temp-doc.md` 임시 파일 생성.
  2. 동기화 스크립트 실행: `node scripts/sync-guides-index.mjs`
  3. `src/data/guides.json` 파일을 읽어 `test-temp-doc` 이 정상 색인되었는지 확인.
  4. 기존에 정렬되어 있던 `Cursor.md` 등의 인덱스 순서와 메타 필드가 훼손되지 않았는지 대조 검증.
  5. 임시 파일 삭제 후 동기화 스크립트 재실행으로 인덱스를 복구.

### B. Windows Standalone 락 프리 검사 (`build-standalone.mjs`)
* **목적**: Vite HMR 서버 가동에 의해 `dist/standalone.html` 파일 리소스가 지속 잠금(Locked) 상태일 때도 빌드 덮어쓰기 프로세스가 예외 없이 종료되는지 확인.
* **검증 시나리오**:
  1. Vite 개발 서버 기동: `npm run dev`
  2. 터미널을 분할하여 `node scripts/build-standalone.mjs` 강제 실행.
  3. **합격 기준**: 빌드가 `Error: EBUSY` 없이 정상 패스되어야 함.

---

## 3. 회귀 테스트 및 빌드 자동화 가이드

로컬 통합 빌드 파이프라인의 변경 사항이 기존 런타임에 문제를 일으키지 않는지 검증하기 위해 빌드 배포 자동화 명령어를 구동합니다:

```bash
# 1) 전체 단위 테스트 구동
npm run test

# 2) 프로덕션 번들 빌드 구동 (전체 페이지 빌드 및 standalone 갱신)
npm run build
```
* 빌드가 성공적으로 종료되어 `dist/` 하위에 에러 없이 모든 산출물이 생성된 것을 확인하면 통합 완료 조건이 만족됩니다.
