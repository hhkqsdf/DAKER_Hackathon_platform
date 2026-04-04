import { Outlet } from 'react-router';
import { Navbar } from './Navbar';

export function Root() {
  return (
    <div className="min-h-screen" style={{ background: '#07070f', color: '#fff' }}>
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }}
        />
        <div
          className="absolute top-1/2 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6d28d9, transparent)' }}
        />
        <div
          className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4c1d95, transparent)' }}
        />
      </div>

      <Navbar />

      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
}