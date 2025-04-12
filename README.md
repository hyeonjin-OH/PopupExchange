# PopupExchange

팝업스토어 정보 공유 및 중고거래 플랫폼입니다.

## 주요 기능

- 사용자 인증
  - 이메일 기반 회원가입/로그인
  - 관리자 권한 관리

- 팝업스토어 관리 (관리자)
  - 팝업스토어 등록/수정/삭제
  - 상품 관리

- 중고거래
  - 게시글 작성/수정/삭제
  - 거래 유형 및 방식 선택
  - 가격 정보 관리

## 기술 스택

- Frontend
  - Next.js 15.3.0
  - React
  - TypeScript
  - Tailwind CSS
  - shadcn/ui

- Authentication
  - Firebase Authentication

- Database
  - Firebase Firestore

## 시작하기

1. 저장소 클론
```bash
git clone https://github.com/hyeonjin-OH/PopupExchange.git
cd PopupExchange
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 Firebase 설정 추가:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. 개발 서버 실행
```bash
npm run dev
```

5. 브라우저에서 확인
```
http://localhost:3000
```

## 라이선스

MIT License
