
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/admin/Sidebar';
import { FullScreenLoader } from '../../components/FullScreenLoader';
import AnimatedPage from '../../components/AnimatedPage';
import { Menu } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-background-primary text-text-primary overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} isMobile={true} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 bg-background-secondary border-b border-border-divider z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-text-primary">
                <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg ml-2">Admin Panel</span>
        </div>

        <main ref={mainRef} className="flex-1 overflow-x-hidden overflow-y-auto bg-background-primary p-4 md:p-6 relative scroll-smooth">
          <Suspense fallback={<FullScreenLoader />}>
            <AnimatedPage>
              <Outlet />
            </AnimatedPage>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
