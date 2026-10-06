# folio — Experience Database 기반 Career OS

취업 준비생의 **Experience → Evidence → Job Matching → Portfolio** 흐름을 구현한 반응형 프로토타입입니다.

## 실행

Node.js 20.9 이상과 npm이 필요합니다. 잠금 파일은 Next.js 16.3.8과 React 19 기반입니다.

```bash
npm install
npm run dev
```

[http://127.0.0.1:3000](http://127.0.0.1:3000)에서 랜딩을 열고 **데모 둘러보기**를 선택하세요. 새 기록으로 시작하려면 회원가입 화면에서 이름과 이메일을 입력하세요.

## 구현한 흐름

- 랜딩, 로그인/가입 데모, 대시보드
- 경험 라이브러리: 검색, 유형/기술/역량/기간/완성도 필터, 카드/리스트 보기
- 경험 직접 입력 → 분석 진행 UI → 주장 수정 → 사용자 확인 → 저장
- 경험 상세: Problem, My Role, Action, Result, Learning, 원문과 주장별 Evidence 발췌
- PDF 이름과 GitHub URL 첨부 UI (본문 분석은 미연결)
- 공고 등록 → 필수/우대 역량 분석 → 설명 가능한 가중 매칭 → Skill Gap
- 포트폴리오 생성, 프로젝트 추가/제외/순서 변경, 제목 편집, 데스크톱/모바일 미리보기
- 프로필 수정, 최근 활동, 전체 검색, 설정, Empty/Loading/Error 상태
- 브라우저 localStorage 저장: 새로고침 후에도 경험/공고/포트폴리오 유지

## 폴더 구조

```text
frontend/                    Next.js 화면, UI, 브라우저 상태 관리
  src/app/                   라우트와 레이아웃
  src/components/            화면과 공통 UI 컴포넌트
  src/lib/                   저장소, UI 유틸리티, Mock 분석 어댑터
  public/                    정적 파일
backend/                     분석·매칭 로직과 DB 설계
  src/services/analysis.ts   경험 분석, 공고 분석, 근거 기반 매칭
  src/mock.ts                브라우저에서 사용 가능한 Mock 모듈만 공개
  tests/                     분석·매칭 회귀 테스트
  supabase/migrations/       PostgreSQL 스키마와 RLS
shared/                      양쪽에서 사용하는 타입과 예시 데이터
  src/types.ts               도메인 타입과 입력 정의
  src/mock-data.ts           예시 데이터
docs/                        프로젝트 설계 문서
```

npm workspaces로 관리하며, 의존성 설치와 실행은 프로젝트 루트에서 합니다. 각 폴더는 별도의 `package.json`과 `tsconfig.json`을 사용하고 공통 TypeScript 설정은 `tsconfig.base.json`을 상속합니다. 잠금 파일은 루트의 `package-lock.json` 하나로 관리합니다.

`npm run dev`, `npm run build`, `npm start`는 프론트엔드를 실행합니다. `npm run typecheck`는 세 workspace를 검사하고 `npm test`는 백엔드 테스트를 실행합니다. 개별 실행은 `npm run typecheck --workspace @folio/backend`처럼 workspace를 지정하세요.

현재 백엔드는 분석 로직과 DB 스키마를 담은 패키지이며 독립 HTTP 서버는 없습니다. 기존 동작을 유지하기 위해 `frontend/src/lib/mock-analysis.ts`가 `@folio/backend/mock`의 순수 함수를 호출합니다. 실제 서버 연결 시 이 어댑터를 API 클라이언트로 교체합니다.

## 분석의 사실 보존 원칙

분석은 **결정론적인 Mock 분석**입니다. 실제 LLM을 호출하지 않습니다. 입력하지 않은 결과와 배움은 '사용자 확인 필요'로 남깁니다. GitHub URL이나 PDF 이름만으로 자료 내용을 검증했다고 판단하지 않습니다.

직접 입력한 기술은 사용자 확인 입력과 연결합니다. 승인 전 초안, 관련 없는 자료, 확인하지 않은 자료는 매칭에 기여하지 않습니다. 요구 역량에 필수 5/우대 2의 가중치를 부여하고, 원본 확인 근거는 1, 사용자 확인 입력은 0.75의 계수를 적용합니다. 점수는 가중 커버리지이며 채용 성공 확률이 아닙니다. TS/TypeScript, REST API/API Integration 같은 명시적 별칭을 정규화합니다. 의미 기반 LLM 매칭은 다음 단계입니다.

데모의 프로젝트·공고·근거 발췌는 모두 예시입니다. 실제 기업의 현재 공고, 실제 사용자 이력 또는 실제 원본 파일로 해석하면 안 됩니다. 확인 필요 주장은 포트폴리오 본문에서 제외됩니다.

## 실제 서비스 연결 범위

현재 로그인은 브라우저 워크스페이스 데모이며 **실제 계정 인증이 아닙니다**. Supabase, Storage, PDF Parser, GitHub API, OpenAI API는 아직 연결되지 않았습니다. 데이터는 서버나 다른 기기에 동기화되지 않습니다. 미리보기 링크는 같은 브라우저의 데이터를 열며, 다른 사람에게 공개되는 웹 공유가 아닙니다.

외부 API 키 없이 바로 실행됩니다. `frontend/.env.example`은 공개 프론트엔드 설정, `backend/.env.example`은 서버 전용 설정의 예시입니다. 현재 Mock 모듈은 환경 변수를 읽지 않습니다. 운영 환경에서는 서버 인증/인가와 수집 파이프라인을 연결해야 합니다.

## 설계

- [프로젝트 구조와 확장 계획](docs/ARCHITECTURE.md)
- [Supabase PostgreSQL 스키마와 소유자 기반 RLS](backend/supabase/migrations/001_initial_schema.sql)

SQL 파일은 설계 산출물이며 이 프로토타입에서 실행하지 않았습니다. 공개 포트폴리오 데이터는 raw evidence를 노출하지 않는 별도 서버 엔드포인트로 제공하도록 설계했습니다.

## 검증

```bash
npm run typecheck
npm run test
npm run build
```

자동 검증은 사실/근거 보존, 승인 전 매칭 방지, 자료별 기술 근거 연결, 필수/우대 가중치, 빈 입력 처리에 집중합니다. 브라우저에서 실제 등록 → 승인 → 공고 분석 → 매칭 → 포트폴리오 구성 및 반응형 화면을 검증했습니다.
