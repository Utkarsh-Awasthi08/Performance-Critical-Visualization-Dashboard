import Dashboard from '@/components/Dashboard';
import { DataProvider } from '@/providers/DataProvider';
import { ControlProvider } from '@/providers/ControlProvider';
import { Suspense } from 'react';

export const metadata = {
  title: 'Quantum Analytics | High Performance Dashboard',
  description: 'Real-time 60fps data visualization processing 10k+ points natively.',
};

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>Loading Dashboard Skeleton...</div>}>
        <ControlProvider>
          <DataProvider>
            <Dashboard />
          </DataProvider>
        </ControlProvider>
      </Suspense>
    </main>
  );
}
