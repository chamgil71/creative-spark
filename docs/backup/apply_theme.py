#!/usr/bin/env python3
"""
apply_theme.py — template.json에 테마를 적용해서 새 json 생성
Usage: python3 apply_theme.py --base template.json --theme violet --font nanum --output template-violet.json
"""
import json
import argparse
import copy
from pathlib import Path

FONT_PRESETS = {
    "nanum": {
        "body":    "나눔고딕",
        "heading": "나눔바른고딕",
        "google_fonts_url": "https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Nanum+Barun+Gothic:wght@400;700&display=swap"
    },
    "noto": {
        "body":    "Noto Sans KR",
        "heading": "Noto Serif KR",
        "google_fonts_url": "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@600;700&display=swap"
    },
    "human": {
        "body":    "나눔고딕",
        "heading": "휴먼명조",
        "google_fonts_url": "https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&display=swap"
    },
    "malgun": {
        "body":    "맑은 고딕",
        "heading": "맑은 고딕",
        "google_fonts_url": ""
    }
}

def apply_theme(base_path: str, color_preset: str, font_preset: str, output_path: str):
    with open(base_path, encoding="utf-8") as f:
        cfg = json.load(f)

    new_cfg = copy.deepcopy(cfg)

    # 색상 교체
    presets = cfg["theme"]["colors"].get("_presets", {})
    if color_preset and color_preset in presets:
        p = presets[color_preset]
        new_cfg["theme"]["colors"]["primary"]      = p["primary"]
        new_cfg["theme"]["colors"]["primary_dark"] = p["primary_dark"]
        new_cfg["theme"]["colors"]["primary_mid"]  = p["primary_mid"]
        # auto 값은 그대로 유지 → resolve_auto에서 재계산됨
        new_cfg["theme"]["colors"]["accent_bg"]  = "auto"
        new_cfg["theme"]["colors"]["table_alt"]  = "auto"
        new_cfg["theme"]["colors"]["border"]     = "auto"
        print(f"✅ 색상 교체: {color_preset} → primary={p['primary']}")
    elif color_preset:
        print(f"⚠️ 색상 프리셋 '{color_preset}'을 찾을 수 없음. 사용 가능: {list(presets.keys())}")

    # 폰트 교체
    if font_preset and font_preset in FONT_PRESETS:
        fp = FONT_PRESETS[font_preset]
        new_cfg["theme"]["fonts"]["body"]    = fp["body"]
        new_cfg["theme"]["fonts"]["heading"] = fp["heading"]
        new_cfg["theme"]["fonts"]["google_fonts_url"] = fp["google_fonts_url"]
        print(f"✅ 폰트 교체: body={fp['body']}, heading={fp['heading']}")
    elif font_preset:
        print(f"⚠️ 폰트 프리셋 '{font_preset}'을 찾을 수 없음. 사용 가능: {list(FONT_PRESETS.keys())}")

    # 이름 업데이트
    new_cfg["meta"]["name"] = f"{cfg['meta']['name']} ({color_preset or 'base'} / {font_preset or 'base'})"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(new_cfg, f, ensure_ascii=False, indent=2)
    print(f"✅ 저장: {output_path}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--base",    required=True)
    p.add_argument("--color",   default="",   help="violet | teal | red | slate")
    p.add_argument("--font",    default="",   help="nanum | noto | human | malgun")
    p.add_argument("--output",  required=True)
    args = p.parse_args()
    apply_theme(args.base, args.color, args.font, args.output)
