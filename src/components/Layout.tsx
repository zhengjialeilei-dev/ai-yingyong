import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="min-h-screen flex p-4 gap-6 relative overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-h-[calc(100vh-2rem)] rounded-3xl bg-white/40 backdrop-blur-sm border border-white/20 shadow-soft overflow-y-auto relative">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
