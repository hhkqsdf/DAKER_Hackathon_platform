# 🚀 DAKER - 해커톤 플랫폼

---

## ✨ Key Features

- 🎯 **지능형 매칭 알고리즘**: 사용자의 기술 스택과 팀의 요구사항을 분석하여 0~100%의 실시간 매칭률 제공
- 👤 **검증된 인재 프로필**: 가상 유저 30여 명의 데이터와 연동되어 수상 경력, 참가 횟수, 티어 시스템 확인 가능
- 📊 **실시간 리더보드**: 연도별/대회별 랭킹 시스템을 통해 신뢰도 높은 팀 데이터 구축
- 🛠 **팀 대시보드 & 협업**: 지원서 관리, 할 일 목록(Todo) 배정 등 실제 협업 프로세스 구현
- 🌓 **다크/라이트 모드 지원**: 사용자 편의를 위한 감각적인 UI/UX (Tailwind CSS 기반)

---

## 🧪 Demo Data & Seed

본 프로젝트는 심사 및 데모를 위해 풍성한 가상 데이터(Seeding)가 포함되어 있습니다.

> [!TIP]
> **데모 재시작 및 데이터 리셋**: 화면 **우측 하단의 리셋(새로고침 모양) 아이콘**을 클릭하면 모든 데이터가 초기 상태로 정규화되어 깨끗한 시연 환경을 제공합니다. 30여 명의 가상 페르소나와 과거 우승 기록들이 미리 로드되어 있어 주요 기능들을 즉시 체험할 수 있습니다.

---

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide React
- **State & Storage**: LocalStorage (Persistent Mocking System)
- **Animation**: Framer Motion
- 
---

## 🏃 Running the code

1. **의존성 설치**
```
npm install
```

2. **개발 서버 실행**
```
npm run dev
```

3. **빌드 및 배포 (선택 사항)**
```
npm run build
```

---

## 📂 Project Structure
- src/app/pages: 각 서비스 화면 (Camp, Hackathons, Profile 등)
- src/app/components: 재사용 가능한 UI 및 비즈니스 컴포넌트
- src/lib/storage.ts: 로컬 스토리지 기반의 데이터 Mocking 시스템 및 초기화 로직
- src/lib/tier.ts: XP 및 티어 계산 알고리즘

---

## 🔗 Project Resources
- Live Demo: [https://daker-hackathon-platform.vercel.app/] 🚀
