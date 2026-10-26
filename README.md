# 🔨 SMASH! 스트레스 풀기

> 말 안 듣는 컴퓨터를 마음껏 부숴 보세요.

옛날 플래시 게임 "컴퓨터 부수기"를 모바일 웹으로 다시 만든 스트레스 해소 게임입니다.

🎮 **https://kimdasomxkimdasom.github.io/smash/**

## 플레이

- 🔨 **망치** — 탭해서 금 내기, 꾹 누르면 연타
- 🏏 **방망이** — 한 방에 크게 부수기
- 🔥 **화염** — 누른 채로 문질러 태우기

모니터·본체·키보드·받침을 전부 박살 내면 걸린 시간과 때린 횟수가 나와요.

## 만든 방법

- **TypeScript + HTML Canvas** (Vite) — 매 프레임 직접 그리기
- **matter.js** — 파편이 튀고 굴러서 쌓이는 2D 물리
- **Web Audio** — 효과음을 파일 없이 코드로 합성 (유리 쨍그랑, 와장창, 화염)
- 진동(안드로이드), 화면 흔들림, 부위별 손상 단계

```text
src/
├─ main.ts              화면 버튼·HUD 연결
├─ game.ts              게임 루프, 터치 입력, 도구별 타격
├─ effects.ts           파편(물리)·불꽃·불·연기
├─ marks.ts             금·움푹 자국·그을음
├─ audio.ts             효과음 합성, 진동
└─ targets/computer.ts  부술 대상: 부품 배치와 그림 (자동차 등은 여기에 추가)
```

## 실행

```bash
npm install
npm run dev     # http://localhost:5173/smash/
npm run build
```

`main`에 push하면 GitHub Actions가 GitHub Pages로 자동 배포합니다.

## 다음 계획

- [ ] 🚗 자동차 부수기
- [ ] 부위별 남은 잔해, 더 다양한 도구
