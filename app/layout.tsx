import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "送货单生成器 · 自然语言一键成单",
  description: "粘贴一段描述，AI 自动解析为规范送货单；支持增删商品行、自动计算、大写金额、打印导出 PDF、本地历史留存。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
