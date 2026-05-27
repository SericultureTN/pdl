import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export function DashboardLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full w-full">
        <aside className="hidden md:flex md:w-72 md:flex-col border-r bg-sidebar text-sidebar-foreground">
          <Sidebar />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="h-14 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Header />
          </header>
          <main className="flex-1 min-h-0 overflow-auto">
            <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

