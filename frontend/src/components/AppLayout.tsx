'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title = 'EMS' }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 size={36} className="animate-spin text-violet-500 mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading EMS...</p>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar (Desktop persistent + Mobile slide-over drawer) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar
          title={title}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
