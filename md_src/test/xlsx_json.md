---
title: "Excel to JSON 변환 파이프라인 분석"
subtitle: "다양한 엑셀-JSON 변환 스크립트의 비교 및 트리 구조 추출 한계 정리"
logo: "📊"
badge: "⚙️ 변환 파이프라인 분석 가이드"
style: ai-dev
heroCta:
  label: "분석 시작하기"
  url: "#compare"
stats:
  - value: "4개 엔진"
    label: "기능 분석 대상"
  - value: "1행 헤더"
    label: "기본 지원 범위"
  - value: "Custom"
    label: "트리 추출 해결책"
done:
  title: "🎉 분석 완료! 이제 설계를 다듬어보세요"
  subtitle: "엑셀 구조화 변환 로직 설계 시 위 비교 내역을 참고해 보시기 바랍니다."
  ctaLabel: "scripts 가이드 바로가기"
  ctaUrl: "../docs/scripts-guide.md"
footer:
  - "이 가이드는 회사 내 ETL/변환 유틸 파이프라인 정합성 분석 결과에 기반하여 제작되었습니다."
---

# 🔍 엔진별 기능 비교 분석 {#compare}

## 1. xl_to_json.py & BudgetN convert.py
기본적인 pandas 변환 도구와 동적 매핑 기법을 사용하는 BudgetN 스크립트의 상세 비교입니다.

::: compare-grid cols=2
- title: "xl_to_json.py (simple)"
  desc: "pandas의 to_dict(orient='records')를 사용해 첫 행(헤더)을 키로 매우 심플하게 직렬화합니다."
  meta: "2행 이상 병합/트리 구조 미지원 | 스키마 추출 기능 없음"
  color: "#D97757"
- title: "BudgetN convert.py (config)"
  desc: "openpyxl로 데이터를 읽고 config.yaml 내 column_mapping 등을 통해 컬럼명을 동적으로 대응합니다."
  meta: "구조적 매핑 지원 | schema(설정)와 data 분리 운영 가능"
  color: "#10B981"
:::

## 2. orchestrator.py & etl_service.py
오케스트레이터 분석기와 Pydantic 검증 모델을 기반으로 작동하는 ETL 서비스 엔진의 비교입니다.

::: compare-grid cols=2
- title: "orchestrator.py (analyzer)"
  desc: "ExcelAnalyzer 엔진을 사용하며, export_config.yaml 설정으로 변환 규칙을 분리 관리합니다."
  meta: "스키마 설정 수동 변경 지원 | 트리 구조 자동화 미지원"
  color: "#3B82F6"
- title: "etl_service.py (Pydantic)"
  desc: "Pydantic 모델(CompanyRecord 등)을 데이터 스키마 검증 레이어로 선언하여 변환 정합성을 체크합니다."
  meta: "자동 데이터 유효성 검증 | 스키마-데이터 완벽 격리"
  color: "#EC4899"
:::

# 📋 핵심 스키마 및 결론 요약

## 1. 기능 종합 및 현상 분석
4대 변환 엔진들의 핵심 한계와 공통 기능 분석 요약 지표입니다.

::: feature-grid cols=3
- icon: "⚠️"
  title: "병합셀 트리 미지원"
  tag: "공통 한계"
  desc: "4개 엔진 모두 pandas/openpyxl의 1행 헤더만 키로 사용하며 2행 이상 헤더의 부모-자식 트리 자동 추출은 미지원합니다."
  color: "#FEF3C7"
- icon: "🔄"
  title: "동기화 한계"
  tag: "자동화 부재"
  desc: "설정이나 스키마(Pydantic)를 변경해도 로컬 data.json 데이터가 실시간 연동되어 자동 리빌드되는 완전 동기화는 부재합니다."
  color: "#FEE2E2"
- icon: "🧩"
  title: "해결 방안"
  tag: "Custom Parser"
  desc: "셀 병합 정보 및 상하 관계 추출을 위해 openpyxl의 cell.coordinate 및 merged_cells 속성 활용 파서 커스텀 구축 권장."
  color: "#E0F2FE"
:::

## 2. 스키마/데이터 분리 수준 정리
각 엔진별 스키마(Schema)와 데이터(Data) 분리 수준을 종합적으로 가시화합니다.

::: stat-grid cols=3
- icon: "Low"
  title: "xl_to_json.py"
  desc: "단순 직렬화로 분리 수준이 가장 낮음"
- icon: "Medium"
  title: "orchestrator / BudgetN"
  desc: "yaml 기반 변환 룰 파일 제공으로 양호"
- icon: "High"
  title: "etl_service.py"
  desc: "Pydantic 강력 유효성 검증 모델로 완전 격리"
:::

# 💡 트리구조 자동화 설계 가이드

## 1. 커스텀 파서 구현 권장 사항
병합된 셀 및 2행 이상 헤더에서 완벽한 트리구조의 schema.json과 data.json을 분리 및 동기화하기 위한 3단계 구현 로직입니다.

::: step-list
- title: "openpyxl 병합셀(merged_cells) 조회"
  desc: "시트를 읽어들여 merged_cells 내에서 상위-하위 셀의 행/열 경계를 파악하고, 빈 셀에 부모 키를 할당합니다."
  color: "#6366F1"
- title: "스키마(schema.json) 생성 및 캐싱"
  desc: "헤더 구조를 계층형 JSON Schema 규격으로 변환 및 보관하여 메타데이터 유효성 레이어를 선언합니다."
  color: "#10B981"
- title: "데이터 매핑 변환 자동화"
  desc: "정립된 스키마에 따라 레코드 행 데이터를 매핑하고, 스키마 변동 발생 시 데이터 변환 스크립트가 트리거되어 갱신되도록 파이프라인을 구축합니다."
  color: "#F59E0B"
:::
