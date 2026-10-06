# Shared

프론트엔드와 백엔드가 함께 사용하는 도메인 타입, 입력 정의, 예시 데이터를 관리합니다. UI, 브라우저 저장소, 서버 SDK와 환경 변수에 의존하지 않습니다.

- `@folio/shared`: `src/types.ts`의 타입과 공통 상수
- `@folio/shared/mock-data`: `src/mock-data.ts`의 예시 경험·공고와 초기 데이터

프로젝트 루트에서 `npm run typecheck --workspace @folio/shared`로 검증합니다. 별도 복사나 빌드 없이 npm workspace를 통해 같은 TypeScript 소스를 사용합니다.
