import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <h1>페이지를 찾을 수 없습니다.</h1>
      <p>주소를 확인하거나 대시보드로 이동해 주세요.</p>
      <Link className="button button-primary" href="/dashboard">
        대시보드로 이동
      </Link>
    </main>
  );
}
