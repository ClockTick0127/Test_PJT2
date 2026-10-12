# Frontend

Next.js 문서 작업실 UI와 Supabase Auth 세션을 담당합니다. 실제 계정은 DB에서 기록을 불러오고, 예시 문서함만 별도의 localStorage를 사용합니다.

루트에서 npm run dev, npm run build, npm run typecheck --workspace @folio/frontend로 실행·검증합니다.

- src/lib/supabase.ts: 공개 URL/키로 브라우저 SDK 생성
- src/lib/store.tsx: 계정/데모/비로그인 모드, 세션 복원, 저장 완료 후 상태 반영
- src/lib/demo-storage.ts: 기존 데모 저장소 호환
- src/lib/mock-analysis.ts: 실제 AI를 호출하지 않는 분석 어댑터

[Supabase 연결 안내](../docs/SUPABASE_SETUP.md)에 따라 .env.local을 설정하세요. 서버 서비스 키를 NEXT_PUBLIC 변수에 넣지 않습니다. components.json과 Next.js/PostCSS 설정은 이 폴더에 있습니다.
