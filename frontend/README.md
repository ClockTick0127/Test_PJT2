# Frontend

Next.js App Router 화면, 공통 UI, localStorage 상태 관리를 담당합니다. 기존 라우트와 저장소 키를 유지합니다.

프로젝트 루트에서 실행합니다.

```bash
npm run dev
npm run build
npm run typecheck --workspace @folio/frontend
```

공통 타입은 `@folio/shared`, 예시 데이터는 `@folio/shared/mock-data`에서 가져옵니다. `src/lib/mock-analysis.ts`는 브라우저에서도 사용할 수 있는 `@folio/backend/mock`의 순수 분석 함수를 호출하는 프로토타입 어댑터입니다. 실제 서버 연결 시 이 파일을 API 클라이언트로 교체합니다.

`components.json`, Next.js/PostCSS/TypeScript 설정, 정적 파일은 이 폴더에 있습니다. shadcn/ui CLI를 사용할 때는 이 폴더를 작업 경로로 지정합니다. `.env.example`에는 공개 프론트엔드 설정만 포함합니다.
