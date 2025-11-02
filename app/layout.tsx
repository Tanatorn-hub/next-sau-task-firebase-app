import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  subsets: ["thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Manage Task App by Tanatorn SAU",
  description: "เว็บแอพพลิเคชันสำหรับจัดการงานที่สร้างโดย Tanatorn SAU",
  keywords: [
    "Task Management",
    "To-Do List",
    "Productivity",
    "Project Management",
    "Task Organizer",
    "Work Planner",
  ],
  authors: [{ name: "Tanatorn SAU", url: "https://github.com/TanatornSAU" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${kanit.className}`}>{children}</body>
    </html>
  );
}
