# folio — Experience Database 기반 Career OS

## 첫 개발 범위

11개 화면의 반응형 프로토타입을 먼저 완성한다. 외부 AI, Supabase 인증, PDF 파싱, GitHub 수집은 연결하지 않는다. 데모 계정과 예시 경험은 명확히 표시하며 브라우저 localStorage에 저장한다. 이 저장소는 해당 기기에서만 동작하며 보안 인증이나 서버 공유 기능을 대신하지 않는다.

## 데이터 흐름

경험 입력 → 결정론적 분석 초안 → 주장별 근거 검토/수정 → 사용자 승인 → 경험 저장 → 공고 요구 역량 분석 → 설명 가능한 매칭 → 프로젝트 선택/순서 변경 → 포트폴리오 미리보기.

분석기는 사용자 입력을 그대로 구조화한다. 누락된 결과/배움은 `사용자 확인 필요`로 남긴다. 자료 URL이나 파일 이름만으로 자료 내용을 확인했다고 판단하지 않는다. 숫자 성과를 생성하지 않는다. 매칭 점수는 증거가 있는 역량과 사용자가 확인한 역량의 가중 커버리지이며 채용 성공 확률이 아니다.

## 디렉터리

- `frontend/src/app`: Next.js App Router, 랜딩/로그인/앱 라우트
- `frontend/src/components/ui`: shadcn/ui 방식의 공통 접근성 컴포넌트
- `frontend/src/components`: 앱 셸, 경험 카드, 근거 뷰, 화면 컴포넌트
- `frontend/src/lib/store.tsx`: 브라우저 저장소와 상태 관리
- `frontend/src/lib/mock-analysis.ts`: 브라우저에서 사용할 Mock 분석 어댑터
- `backend/src/services/analysis.ts`: 근거 보존 분석 및 설명 가능한 직무 매칭
- `backend/src/mock.ts`: 브라우저에서도 사용할 수 있는 분석 함수의 명시적 공개 진입점
- `backend/supabase/migrations`: PostgreSQL 스키마, 소유자 기반 RLS
- `backend/tests`: 근거/분석/매칭 회귀 검증
- `shared/src/types.ts`: 공통 도메인 타입과 입력 정의
- `shared/src/mock-data.ts`: 데모 데이터 (실제 사용자 경험으로 오인하지 않도록 표시)
- `tsconfig.base.json`: 세 workspace가 상속하는 공통 TypeScript 설정

## 패키지 경계

의존 방향은 `frontend → backend/mock → shared`, `frontend → shared`입니다. 백엔드와 공통 패키지는 프론트엔드 UI나 localStorage에 의존하지 않습니다. 테스트도 백엔드 분석 로직과 공통 예시 데이터만 사용합니다.

백엔드의 package exports는 `@folio/backend/mock`만 공개합니다. 이 진입점은 환경 변수, 파일 I/O, 네트워크 호출, 서버 SDK 없이 동작하며 기존 프로토타입에서는 브라우저에 번들됩니다. 분석 로직을 파일 위치만으로 서버 전용이라고 간주하지 않습니다. 서버 인증, 비밀 키, DB/LLM 클라이언트는 이 모듈이나 의존 모듈에 추가하지 않아야 합니다.

현재는 독립 HTTP 서버가 없으며 데이터를 전송하지 않습니다. 실제 API 연결 시 백엔드에 서버 전용 진입점과 API를 만들고, 프론트엔드 Mock 어댑터를 비동기 API 클라이언트로 교체합니다. Next.js 설정은 workspace 공통 루트와 로컬 TypeScript 패키지 번들을 명시합니다.

브라우저 저장소 키 `folio-career-os-v1`과 데이터 형식은 유지합니다. 폴더 리팩토링 이후에도 같은 브라우저와 주소에서 기존 경험·공고·포트폴리오를 읽습니다.

프론트엔드 환경 변수 예시는 `frontend/.env.example`, 서버 전용 키 예시는 `backend/.env.example`에 둡니다. 현재 Mock 분석은 어느 파일도 읽지 않습니다.

## 다음 단계

1. Supabase Auth와 repository adapter로 브라우저 저장소 교체.
2. Storage 업로드, PDF parser, GitHub API로 본문과 위치 정보를 확보.
3. 백엔드 HTTP API와 서버 전용 LLM 클라이언트를 추가하고, 프론트엔드 Mock 어댑터를 API 클라이언트로 교체. JSON 스키마 검증 후 분석하고 모든 주장에 evidence_id/인용/확인 상태를 저장.
4. URL 수집 시 SSRF 방어, 업로드 크기/MIME 검증, 비공개 자료 접근 제어 추가.
5. 공개 포트폴리오는 별도의 서버 쿼리로 승인된 주장만 제공. 사용자 자료 원본은 자동 공개하지 않음.

## 기술

Next.js App Router, TypeScript, Tailwind CSS, Radix 기반 shadcn/ui 컴포넌트. DB: Supabase/PostgreSQL 설계. 백엔드/LLM 연결은 UI 검증 후 진행.
