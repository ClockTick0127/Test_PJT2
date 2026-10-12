# Backend

계정 저장소, 경험·공고 분석, 근거 기반 매칭, DB 스키마와 회귀 테스트를 담당합니다. 독립 HTTP 서버는 없으며 데이터 저장은 Supabase Data API와 PostgreSQL RPC/RLS를 사용합니다.

루트에서 npm test와 npm run typecheck --workspace @folio/backend로 검증합니다.

- src/repositories/account.ts: 계정 조회, DB 모델 변환, 변경분 단위의 원자적 저장
- src/services/analysis.ts: 기존 Mock 분석·매칭
- src/services/auth.ts: 비밀번호 복구 메일 요청, 현재 사용자 검증 후 비밀번호 변경
- src/mock.ts: 브라우저에서도 사용할 수 있는 Mock 모듈
- supabase/migrations/001_initial_schema.sql: 최초 스키마와 소유자 기반 RLS
- supabase/migrations/002_account_storage.sql: 프로필 트리거, 계정 저장 RPC와 여러 근거 연결
- tests/account-storage.test.ts: 로컬 PostgreSQL의 두 사용자·익명 접근, 참조와 트랜잭션 검증
- tests/auth.test.ts: SDK 복구 요청·세션 확인·비밀번호 변경과 실패 응답 검증
- tests/workspace.test.ts: 재승인 전 포트폴리오 표시와 문서 삭제 시 원본 보존 검증

공개 @folio/backend/account 모듈은 현재 사용자의 SDK 토큰으로 DB를 요청합니다. @folio/backend/auth와 @folio/backend/mock도 브라우저에 번들되므로 서버 비밀 키나 LLM 클라이언트를 넣지 않아야 합니다. 계정 데이터를 localStorage에 복제하지 않습니다.

실제 Supabase 프로젝트에는 두 마이그레이션을 순서대로 적용해야 합니다. 현재 작업환경의 온라인 프로젝트에는 적용과 원격 저장 검증을 완료했습니다. [연결 안내](../docs/SUPABASE_SETUP.md)를 참고하세요.
