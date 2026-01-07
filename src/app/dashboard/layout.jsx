import { Sidebar } from "@/components/ui/sidebar";
import { MobileSidebar } from "@/components/ui/mobile-sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 py-4 sm:px-6 sm:py-8 relative">
        <div className="lg:hidden fixed top-4 right-4 z-50">
          <MobileSidebar />
        </div>
        {children}
      </main>
    </div>
  );
}
