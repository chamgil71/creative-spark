지금 네 구조는 사실상:

```json id="eznccq"
{
  "brand": "#10A37F",
  "brandDark": "#0D8065",
  ...
}
```

처럼 **"디자인 토큰(design token)" 시스템**이야.

즉:

* 색상값을 JSON으로 정의
* CSS/React/Tailwind에서 재사용
* 스타일을 자동으로 통일

하는 구조.

---

그런데 실제 UI 만들다 보면
단순 색상만으로 부족해져.

예를 들어:

* 버튼 위 글자색
* 카드 그림자색
* 네온 효과
* hover glow
* 배경 블러

같은 것도 스타일별로 달라야 함.

그래서 이런 필드를 추가하자는 뜻이야.

---

# 1. textOnBrand

예:

```json id="h7n3s7"
"textOnBrand": "#FFFFFF"
```

의미:

> brand 색상 위에 올라가는 글자색

---

예를 들어 버튼:

```css id="0ofb3o"
background: var(--brand);
color: var(--textOnBrand);
```

---

현재 네 brand 색상은 대부분 진해서:

```css id="twmzvv"
#10A37F
#1565C0
#9B59B6
```

위에 흰 글씨가 잘 보임.

그래서:

```json id="kbjlwm"
"textOnBrand": "#FFFFFF"
```

를 넣는 거야.

---

반대로 노란색 계열이면?

```css id="p2j7a5"
background: #FFD54F;
```

흰 글씨가 안 보임.

그럼:

```json id="9myby0"
"textOnBrand": "#111111"
```

같이 검정 글씨 써야 함.

---

즉:

```json id="k0jol6"
"textOnBrand"
```

는:

> "메인 컬러 위에 어떤 글자색을 써야 하나?"

를 저장하는 필드.

---

# 2. cardShadow

예:

```json id="36f0px"
"cardShadow": "rgba(16, 163, 127, 0.12)"
```

의미:

> 카드 그림자 색상

---

일반 그림자:

```css id="9xprh1"
box-shadow: 0 10px 30px rgba(0,0,0,0.1);
```

이건 모든 카드가 검은 그림자임.

근데 요즘 SaaS UI는:

* 브랜드 컬러 기반 그림자
* 살짝 색이 들어간 shadow

를 많이 씀.

---

예:

그린 테마 카드:

```css id="xqitmw"
box-shadow: 0 10px 30px rgba(16, 163, 127, 0.12);
```

블루 테마 카드:

```css id="wc6s2v"
box-shadow: 0 10px 30px rgba(21, 101, 192, 0.12);
```

---

그러면 카드가 아주 미세하게:

* 초록빛
* 파란빛

분위기를 띔.

엄청 고급스러워짐.

---

# 3. glow

이게 핵심.

예:

```json id="mlylvi"
"glow": "rgba(16, 163, 127, 0.35)"
```

---

이걸 CSS에서:

```css id="8vl4ko"
box-shadow: 0 0 30px var(--glow);
```

이렇게 사용.

---

결과:

## glow 없음

```css id="bxjqgw"
box-shadow: none;
```

그냥 평범한 버튼.

---

## glow 있음

```css id="byvf1s"
box-shadow: 0 0 30px rgba(16,163,127,0.35);
```

버튼 주변에 빛이 퍼짐.

마치:

* 네온
* AI
* 사이버펑크
* 미래형 UI

느낌 남.

---

# 실제 느낌

예를 들어 ChatGPT 스타일 버튼:

```css id="czn3a0"
background: #10A37F;
box-shadow: 0 0 30px rgba(16,163,127,0.35);
```

그러면:

* 초록빛 aura
* 은은한 광원
* hover 시 빛남

효과 가능.

---

# 4. heroText

예:

```json id="l6h4jc"
"heroText": "#FFFFFF"
```

의미:

> hero section(맨 위 큰 영역) 글자색

---

네 heroGradient는 지금 다 어두움.

```css id="k3m0ee"
linear-gradient(...)
```

그래서 대부분 흰 글씨 필요.

---

근데 만약 밝은 gradient 쓰면?

```css id="k2f6gr"
yellow -> white
```

흰 글씨 안 보임.

그럼:

```json id="31zmp4"
"heroText": "#111111"
```

같이 바꿈.

---

# 최종적으로는 이런 구조가 됨

```json id="t2b0cs"
"ai-chat": {
  "label": "AI 챗봇 (그린)",

  "brand": "#10A37F",
  "brandDark": "#0D8065",
  "brandDeep": "#085C4A",

  "brandLight": "#E6F4F0",
  "brandMid": "#A8DDD0",

  "border": "#C8E6DF",
  "bg": "#F7FBF9",

  "textOnBrand": "#FFFFFF",
  "heroText": "#FFFFFF",

  "cardShadow": "rgba(16, 163, 127, 0.12)",
  "glow": "rgba(16, 163, 127, 0.35)",

  "heroGradient": "linear-gradient(...)"
}
```

---

# 그러면 CSS에서 이렇게 가능

```css id="o61g0v"
.button {
  background: var(--brand);
  color: var(--textOnBrand);

  box-shadow:
    0 10px 30px var(--cardShadow),
    0 0 20px var(--glow);
}
```

---

# 결과적으로 얻는 것

## 지금 상태

* 색상만 바뀜

---

## 추가 필드 적용 후

* 버튼 분위기 바뀜
* 카드 깊이감 생김
* 브랜드 느낌 강화
* futuristic glow 가능
* 테마별 개성 강화

