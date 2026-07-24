# 오션중학교 교육자료 나눔터

오션중학교 선생님들이 만든 업무간소화 웹앱, 교수학습자료, 수업도구를 공개하는 포털입니다.

## 공용 소유 구조

- GitHub 소스: `vibeoschool/education-sharing-portal`
- 배포 자동화: `vibeoschool/platform-automation`
- 운영 배포: 오션중학교 공용 Vercel Team
- 선택 데이터 기반: 오션중학교 공용 Supabase Organization
- 공용 운영 계정: `ocean_all@ocean.ms.kr`

포털 저장소에는 개인 계정 ID, Vercel 토큰, Supabase 비밀키를 저장하지 않습니다. `main` 브랜치 변경은 중앙 자동화가 확인하여 학교 Vercel Team의 `education-sharing-portal` 프로젝트에 배포합니다.

## 로컬 실행

```bash
npm ci
npm run dev
npm test
npm run build:vercel
```

## Supabase 공개 설정

Supabase를 사용하는 기능을 추가할 때 중앙 자동화 저장소의 GitHub Actions secrets에 다음 값만 저장합니다.

| Secret | 용도 |
|---|---|
| `SUPABASE_URL` | 공용 Supabase 프로젝트 URL |
| `SUPABASE_PUBLISHABLE_KEY` | 브라우저에 공개 가능한 publishable key |

두 값은 Vercel 빌드 시 각각 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`로 전달됩니다. `SUPABASE_SECRET_KEY`와 기존 `service_role` 키는 포털 빌드나 브라우저 코드에 넣지 않습니다.

로컬에서는 [`.env.example`](./.env.example)을 복사해 `.env.local`을 만들 수 있습니다. 실제 값이 없어도 현재 GitHub 카탈로그 기반 포털은 정상 동작합니다.

## 배포

중앙 저장소의 `Deploy education sharing portal` Workflow는 다음 순서로 동작합니다.

1. 조직 소유 포털 저장소의 `main`을 체크아웃합니다.
2. 학교 Vercel Team에서 `education-sharing-portal` 프로젝트를 찾거나 생성합니다.
3. Vercel Production 빌드를 수행합니다.
4. Supabase 공개 설정이 있으면 빌드에만 전달합니다.
5. 검증된 결과를 Production으로 게시합니다.

Workflow는 10분마다 변경을 확인하며 필요할 때 수동 실행할 수도 있습니다.
