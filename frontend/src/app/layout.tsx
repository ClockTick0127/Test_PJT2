import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store";
import "./globals.css";
import "./document-workspace.css";
export const metadata: Metadata = {
  title: { default: "folio — 경험이 기회가 되는 곳", template: "%s · folio" },
  description:
    "나의 경험을 모으고, 근거로 연결하고, 다음 기회를 준비하세요. Experience Database 기반 Career OS.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
