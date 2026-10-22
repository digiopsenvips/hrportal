'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AttendanceRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/moms?tab=attendance');
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#2FC3A5] border-t-transparent"></div>
        <p className="mt-3 text-xs font-semibold text-[#637d74]">Redirecting to unified MoM & Attendance hub...</p>
      </div>
    </div>
  );
}
