# folio — Experience Database 기반 Career OS

취업 준비생의 **Experience → Evidence → Job Matching → Portfolio** 흐름을 구현하는 문서 작업실입니다.

## 현재 구현 범위

- 랜딩, 문서 중심의 대시보드·경험 라이브러리, 반응형 UI
- Supabase 이메일·비밀번호 회원가입, 이메일 확인 안내, 세션 복원, 로그아웃, 비밀번호 재설정
- 계정별 프로필·경험 등록/조회/원문 수정/분석 승인/삭제와 DB 저장
- 공고 등록·수정·삭제, 포트폴리오 편집·삭제와 동일 계정 DB 저장
- 실제 계정과 분리된 브라우저 데모 문서함
- 경험 구조화, 공고 분석, 근거 기반 매칭, Skill Gap, 포트폴리오 편집·미리보기
- Loading/Empty/Error 상태, 저장 실패 시 성공 처리 방지, 전체 문서 검색

**이 작업환경은 온라인 Supabase 프로젝트에 연결되어 있습니다.** 서울 리전의 `folio-career-os`에 두 마이그레이션을 적용했고, `frontend/.env.local`에 공개 URL과 publishable key를 설정했습니다. 원격 DB 저장·조회, 계정 격리와 익명 접근 차단을 검증했습니다. 실제 이메일 인증과 기기 간 로그인은 사용자 계정으로 확인해야 합니다. 다른 기기나 배포 환경에서는 [연결 안내](docs/SUPABASE_SETUP.md)에 따라 환경 변수를 별도로 설정하세요.

분석·매칭은 결정론적인 Mock입니다. 실제 LLM, PDF 파싱, GitHub 본문 수집과 공개 포트폴리오 공유는 아직 연결하지 않았습니다.

## 실행

Node.js 20.9 이상과 npm이 필요합니다. 프로젝트 루트에서 실행합니다.

```bash
npm install
npm run dev
```

[http://127.0.0.1:3000](http://127.0.0.1:3000)에서 예시 문서함을 둘러볼 수 있습니다. 실제 계정 기능은 [Supabase 연결 안내](docs/SUPABASE_SETUP.md)에 따라 설정하세요.

## 폴더 구조

```text
frontend/                  Next.js 화면, 인증 세션, 계정·데모 상태 관리
  src/app/                 라우트와 레이아웃
  src/components/          문서 화면과 공통 UI
  src/lib/supabase.ts      공개 키를 사용하는 브라우저 SDK
  src/lib/store.tsx        로그인·계정 로딩·비동기 저장
  src/lib/demo-storage.ts  별도의 데모 localStorage
backend/                   데이터 접근, 분석 로직, DB 설계
  src/repositories/        Supabase 계정 조회와 변경분 저장
  src/services/            Mock 분석·매칭
  supabase/migrations/     스키마·RLS·프로필 트리거·저장 RPC
  tests/                   분석·DB·계정 격리 테스트
shared/                    공통 타입과 예시 데이터
docs/                      설계와 연결 안내
```

npm workspaces와 루트 package-lock.json 하나로 관리합니다. npm run build와 npm start는 프론트엔드 실행, npm run typecheck는 세 workspace 검사, npm test는 백엔드 테스트입니다.

백엔드는 데이터 접근·분석 패키지이며 독립 HTTP 서버는 없습니다. 계정 저장은 Supabase Data API와 RLS 및 트랜잭션 RPC를 사용합니다. Mock 분석과 데이터 접근의 공개 진입점에는 서버 비밀 키를 넣지 않습니다.

## 데이터와 근거

계정 데이터는 Supabase DB에 저장합니다. 새 계정은 빈 문서함으로 시작하고 예시 기록이나 기존 데모 기록을 자동으로 업로드하지 않습니다. 데모만 folio-career-os-v1 키의 localStorage를 사용합니다. 비밀번호는 앱 저장소에 기록하지 않으며 세션 토큰 관리는 Supabase SDK가 담당합니다.

직접 입력한 기술과 설명은 사용자 확인 근거와 연결합니다. 누락된 성과·학습은 사용자 확인 필요로 남깁니다. URL과 PDF 이름만으로 본문을 확인했다고 판단하지 않으며, 계정 사용자가 원본 검증 상태를 임의로 부여하는 저장은 DB에서 거부합니다.

승인 전 초안과 확인되지 않은 자료는 매칭에 기여하지 않습니다. 필수 5/우대 2, 원본 확인 1/사용자 확인 0.75의 가중 커버리지를 사용하며 채용 성공 확률이 아닙니다. 수정한 경험은 재승인 전까지 포트폴리오 본문·기술·표시 개수에서 제외하며, 재승인하면 기존 순서로 돌아옵니다. 확인 필요 주장은 포트폴리오 본문에서 제외합니다. 공고 삭제는 포트폴리오의 공고 연결만 해제하고, 포트폴리오 삭제는 원본 경험과 공고를 유지합니다.

현재 포트폴리오 링크는 데모라면 같은 브라우저, 계정이라면 같은 계정으로 로그인한 기기에서만 열 수 있습니다. 타인에게 공개되는 공유 링크는 다음 단계입니다.

## 검증

```bash
npm run typecheck
npm test
npm run build
```

DB 테스트는 PGlite의 PostgreSQL에 스키마를 적용해 사용자별 RLS, 익명 접근 차단, 계정 전환 중 저장 차단, 여러 근거 연결, 승인/수정, 삭제 연쇄 처리, 저장 실패 시 롤백을 검사합니다. 실제 Supabase 프로젝트의 이메일 인증과 기기 간 로그인은 프로젝트 설정 후 별도로 확인해야 합니다.

- [프로젝트 설계](docs/ARCHITECTURE.md)
- [Supabase 연결과 검증](docs/SUPABASE_SETUP.md)
