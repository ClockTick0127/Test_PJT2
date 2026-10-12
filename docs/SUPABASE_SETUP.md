# Supabase 계정·DB 연결

이 작업환경은 2026-10-12에 온라인 Supabase에 연결했습니다. 아래 설정 절차는 새 프로젝트나 다른 기기에서 연결할 때 사용하세요.

## 현재 연결 상태

- 프로젝트: `folio-career-os` / `ztcmlmhsjvxzrransfyd`
- 조직: `ClockTick0127's Org`, Free 요금제
- 리전: 서울 (`ap-northeast-2`)
- URL: `https://ztcmlmhsjvxzrransfyd.supabase.co`
- 마이그레이션: `folio_initial_schema`, `folio_account_storage` 적용 완료. 아래 SQL 파일을 이 프로젝트에 다시 실행하지 마세요.
- 앱 설정: `frontend/.env.local`에 publishable key 설정 완료. 이 파일은 Git에서 제외됩니다.
- Site URL: `http://127.0.0.1:3000`
- Redirect URLs: `http://127.0.0.1:3000/login`, `http://localhost:3000/login`, `http://127.0.0.1:3000/reset-password`, `http://localhost:3000/reset-password`

원격 PostgreSQL에서 프로필 트리거, 경험·근거·공고·포트폴리오 저장과 조회, 계정 격리, 계정 전환 중 저장 거부, 익명 접근 차단을 검증했습니다. 테스트는 트랜잭션을 롤백했으며 테스트 계정과 문서는 남지 않았습니다. 공개 키로 Auth 설정과 Data API 접근도 확인했고, 앱 로그인 화면의 계정 기능이 활성화되었습니다. 보안 Advisor 경고는 없으며, 성능 Advisor는 RLS 함수 평가와 외래 키 인덱스의 추후 최적화를 안내합니다.

성능 최적화 참고: [RLS 함수 평가](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan), [외래 키 인덱스](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys). 신규 프로젝트의 미사용 인덱스 안내는 실제 사용량이 쌓인 뒤 판단합니다.

실제 가입·이메일 인증·재로그인·다른 기기 조회는 아직 사용자 계정으로 검증하지 않았습니다. 현재 custom SMTP는 설정하지 않았습니다. 기본 메일 발송은 Supabase 조직 멤버 이메일로 제한되므로 처음에는 Supabase 계정에 사용하는 이메일로 가입하세요. 다른 사용자의 이메일 인증에는 별도 SMTP 설정이 필요합니다. [공식 SMTP 안내](https://supabase.com/docs/guides/auth/auth-smtp)

## 1. 프로젝트 준비

Supabase에서 사용할 프로젝트를 만든 뒤 SQL Editor에서 아래 파일을 **순서대로 한 번씩** 실행합니다.

1. [001_initial_schema.sql](../backend/supabase/migrations/001_initial_schema.sql)
2. [002_account_storage.sql](../backend/supabase/migrations/002_account_storage.sql)

001을 이미 적용했다면 002만 실행하세요. 두 파일 모두 기존 구조 위에 추가하는 마이그레이션이며 재실행용 스크립트가 아닙니다. 테스트용 프로젝트에서 먼저 적용하세요.

002는 계정 생성 시 프로필을 만들고, 경험 원문·기술·분석 주장·여러 근거 연결을 저장하는 컬럼과 함수를 추가합니다. 예시 경험이나 공고는 계정에 넣지 않습니다. 직접 입력한 기술은 경험별 배열로 보관하며 전역 skills 카탈로그는 아직 자동으로 채우지 않습니다.

## 2. 공개 연결 정보 설정

프로젝트의 URL과 **publishable key**를 frontend/.env.local에 넣습니다. 이전 형식의 anon key도 지원합니다. service_role 또는 secret key를 NEXT_PUBLIC 변수에 넣지 마세요.

프로젝트 루트 PowerShell에서 예시 파일을 복사할 수 있습니다. 이미 설정 파일이 있으면 복사 대신 기존 파일을 수정하세요.

```powershell
Copy-Item frontend/.env.example frontend/.env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
# publishable key 대신 기존 anon key를 사용하는 경우:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

이 단계에는 서버 서비스 키나 LLM API 키가 필요하지 않습니다. DB 요청에는 현재 로그인한 사용자의 토큰을 사용하며, RLS가 소유권을 검사합니다.

## 3. 이메일 인증 URL

Supabase Authentication의 URL Configuration에서 개발용 Site URL을 http://127.0.0.1:3000으로 설정하고 Redirect URLs에 http://127.0.0.1:3000/login을 등록합니다. localhost 주소로도 사용할 경우 해당 주소를 별도로 등록하세요. 배포 후에는 실제 운영 주소로 변경해야 합니다.

비밀번호 재설정을 위해 `http://127.0.0.1:3000/reset-password`도 등록하세요. localhost를 사용할 경우 `http://localhost:3000/reset-password`를 함께 등록합니다. 배포할 때 운영 주소의 `/login`과 `/reset-password`를 둘 다 등록하세요. 앱은 공개 키와 복구 세션으로 현재 사용자의 비밀번호를 변경하며 서버 비밀 키는 필요하지 않습니다.

이메일 가입과 이메일 확인 설정을 유지하세요. 가입 결과에 세션이 없으면 앱은 인증 메일 안내를 표시합니다. 인증 링크로 /login에 돌아오면 SDK가 세션을 복원하고 계정 문서함을 불러옵니다.

## 4. 재실행 및 확인

환경 변수를 설정한 뒤 개발 서버를 종료하고 다시 실행합니다.

```bash
npm run dev
```

- /login?mode=signup에서 이름·이메일·비밀번호를 입력합니다.
- 인증 메일이 요구되면 링크를 누르고 로그인합니다.
- 새 계정의 경험·공고·포트폴리오가 모두 비어 있는지 확인합니다.
- 경험을 등록하고 분석 초안을 수정·승인합니다. 분석은 여전히 Mock입니다.
- 경험 상세의 원문 수정과 삭제를 확인합니다.
- 포트폴리오에 포함된 경험을 수정하면 재승인 안내가 표시되고 본문·기술·경험 수에서 제외되는지 확인합니다. 재승인하면 기존 순서로 다시 표시되어야 합니다.
- 공고 수정은 기존 포트폴리오 연결을 유지해야 합니다. 공고를 삭제하면 포트폴리오와 경험을 유지하고 공고 연결만 해제해야 합니다.
- 포트폴리오를 삭제해도 경험과 공고는 유지되어야 합니다.
- 로그인 화면의 비밀번호 재설정 링크를 요청하고 메일에서 새 비밀번호를 설정합니다. 만료된 링크와 비밀번호 불일치 안내, 변경 후 재로그인을 확인합니다.
- 로그아웃 후 재로그인하고 같은 기록이 보이는지 확인합니다.
- 다른 브라우저에서 같은 계정으로 로그인해 저장된 기록을 확인합니다.
- 두 번째 계정에서는 첫 계정의 문서가 보이지 않아야 합니다.
- 사용자 B의 토큰으로 사용자 A의 ID를 직접 조회·수정해도 접근할 수 없어야 합니다.
- 네트워크가 끊긴 상태의 저장은 성공 안내 없이 실패를 표시하고 기존 데이터는 유지해야 합니다.

계정 데이터는 DB에 저장하며 데모의 localStorage 기록을 자동으로 업로드하지 않습니다. 로그인 세션 토큰은 Supabase SDK가 브라우저에서 관리합니다. 비밀번호 재설정 화면과 SDK 요청·오류 처리를 구현했으며, 실제 메일 수신과 비밀번호 변경은 사용자 계정으로 확인해야 합니다. 계정 문서의 공개 공유, 실시간 동기화, 실제 AI와 PDF/GitHub 수집은 이번 범위에 포함하지 않습니다.

## 검증 범위

npm test는 PGlite의 로컬 PostgreSQL에 두 마이그레이션을 실제 적용해 트랜잭션과 RLS를 검증합니다. 테스트에서 auth.users/auth.uid와 역할을 준비하고 사용자 A/B 및 익명 사용자를 전환합니다. 원격 Supabase Auth의 이메일 전송·세션 발급을 대신하는 테스트는 아니므로 프로젝트 설정 후 위 수동 검증도 진행해야 합니다.

## 문제 해결

- 버튼이 비활성화: 환경 변수 이름과 frontend/.env.local 위치를 확인하고 서버를 재시작하세요.
- 계정 기록 로딩 실패: 두 SQL 파일과 프로필 생성 트리거가 적용되어 있는지 확인하세요. 화면의 다시 불러오기를 사용할 수 있습니다.
- 잘못된 이메일·비밀번호 또는 이메일 미인증: 로그인 화면에 해당 안내가 표시됩니다.
- 저장 실패: 변경 내용은 성공으로 반영하지 않습니다. 입력을 유지하고 연결 복구 후 다시 저장하세요.

공식 참고: [이메일 가입](https://supabase.com/docs/reference/javascript/auth-signup), [사용자 프로필 관리](https://supabase.com/docs/guides/auth/managing-user-data), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
