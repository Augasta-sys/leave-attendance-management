import { useState, type ReactNode } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E] dark:bg-[#0D0D0D] dark:text-white">
      {/* Full Width Header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Sidebar + Main Content */}
      <div className="flex min-h-[calc(100dvh-72px)]">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="min-w-0 flex-1 lg:ml-[260px]">
          <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}