# 엑셀(xlsx) → JSON 변환 스크립트 기능 비교 및 정리

## 1. `convertertools/engines/excel/xl_to_json.py`
- **상위행 자동 인식/키 생성:**
  - 단순히 pandas의 `to_dict(orient="records")`로 변환. 엑셀의 첫 행(헤더)을 키로 사용.
  - **2행 이상 병합헤더/트리구조:** 지원하지 않음. 병합된 셀이나 2행 헤더의 트리구조를 별도 처리하지 않음.
- **schema/data 분리:**
  - 별도 schema 추출/저장 기능 없음. 시트별 전체 데이터를 바로 json/yaml로 저장.
- **schema 기반 data.json 자동변환:**
  - 지원하지 않음.

## 2. `BudgetN/scripts/pipeline/convert.py`
- **상위행 자동 인식/키 생성:**
  - openpyxl로 시트별 데이터를 읽고, config의 column_mapping 등으로 컬럼명/구조를 동적으로 매핑.
  - 2행 이상 헤더, 병합셀 등 복잡한 구조에 대해 일부 커스텀 로직이 있을 수 있으나, 완전한 트리관계 자동 추출은 코드 전체 확인 필요.
- **schema/data 분리:**
  - config.yaml 등에서 컬럼 매핑, 연도별 필드 등 schema 역할을 하는 설정을 분리 관리.
  - data.json, merged.json 등 데이터와 schema(설정) 분리 가능.
- **schema 기반 data.json 자동변환:**
  - 컬럼 매핑/설정 변경 시, 데이터 변환 로직이 반영됨(수동/반자동).

## 3. `convertertools/main.py` + `services/orchestrator.py`
- **상위행 자동 인식/키 생성:**
  - 내부적으로 ExcelAnalyzer 등에서 pandas/openpyxl로 헤더를 읽어 키로 사용. 2행 이상 헤더/병합셀의 트리구조 자동 추출은 기본 미지원.
- **schema/data 분리:**
  - export_config.yaml, convert_config.yaml 등에서 변환 규칙/스키마를 분리 관리 가능.
- **schema 기반 data.json 자동변환:**
  - schema(설정) 변경 시 변환 결과가 달라질 수 있으나, 완전 자동화/동기화는 아님.

## 4. `companypool/engine/etl_service.py`
- **상위행 자동 인식/키 생성:**
  - ExcelReader에서 첫 행을 키로 사용. 2행 이상 헤더/병합셀 트리구조 자동 추출은 미지원.
- **schema/data 분리:**
  - Pydantic 모델(CompanyRecord 등)로 schema 역할을 분리.
- **schema 기반 data.json 자동변환:**
  - 모델 구조 변경 시, 데이터 검증/변환이 반영됨.

---

## 결론 및 요약
- **2행 이상 헤더/병합셀 트리구조 자동 추출:**
  - 위 4개 스크립트 모두 기본적으로 pandas/openpyxl의 1행 헤더만 키로 사용. 2행 이상 헤더의 트리구조(상위-하위 관계) 자동 추출 및 schema-data 완전 분리/동기화는 기본 미지원.
  - 일부 프로젝트(`BudgetN/convert.py` 등)는 config 기반 컬럼 매핑, Pydantic 모델 등으로 schema와 data를 분리 관리하지만, schema 변경 시 data.json을 자동으로 동기화/변환하는 완전 자동화 기능은 없음.

- **schema/data.json 분리 및 동기화:**
  - config.yaml, export_config.yaml, Pydantic 모델 등으로 schema와 data를 분리 관리하는 구조는 있으나, schema를 수정하면 data.json이 자동으로 변경되는 기능은 별도 구현 필요.

---

## 참고: 2행 이상 헤더/병합셀 트리구조 자동 추출/동기화가 필요한 경우
- 별도의 커스텀 파서 구현 필요 (openpyxl로 셀 병합/헤더구조 파악 → 트리구조 schema 생성 → data 매핑)
- schema.json, data.json을 완전히 분리하고, schema 변경 시 data.json을 자동 변환하는 별도 스크립트 필요

---

(작성일: 2026-04-16, by GitHub Copilot)
