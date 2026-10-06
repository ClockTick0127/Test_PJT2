# Backend

경험·채용공고 분석, Evidence 기반 매칭, Skill Gap 계산, DB 스키마와 회귀 테스트를 담당합니다. 현재는 순수 분석 로직 패키지이며 독립 HTTP 서버나 실제 DB/LLM 연결은 없습니다.

프로젝트 루트에서 실행합니다.

```bash
npm test
npm run typecheck --workspace @folio/backend
```

- `src/services/analysis.ts`: 기존 결정론적 분석 및 매칭 로직
- `src/mock.ts`: 프로토타입용 공개 진입점 `@folio/backend/mock`
- `tests/analysis.test.ts`: 사실 보존과 매칭 회귀 검증
- `supabase/migrations/001_initial_schema.sql`: PostgreSQL 스키마와 소유자 기반 RLS

Mock 진입점과 그 의존 모듈은 브라우저에 번들됩니다. 서버 전용 키, DB/LLM SDK, 환경 변수 접근을 추가하지 않아야 합니다. 서버 전용 설정 예시인 `.env.example`은 향후 HTTP API에서 사용할 예정이며 현재 분석 로직은 이를 읽지 않습니다.

실제 서버 연결 시 서버 전용 API와 인증/저장소 어댑터를 추가하고, 프론트엔드의 Mock 어댑터를 API 클라이언트로 교체합니다. SQL 파일은 이 프로토타입에서 실행하지 않았습니다.
