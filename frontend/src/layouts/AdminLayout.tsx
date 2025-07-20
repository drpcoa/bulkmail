import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white">
        <div className="p-4 text-2xl font-bold">Admin Panel</div>
        <nav>
          <ul>
            <li><Link to="/admin/dashboard" className="block p-4 hover:bg-gray-700">Dashboard</Link></li>
            <li><Link to="/admin/users" className="block p-4 hover:bg-gray-700">Users</Link></li>
            <li><Link to="/admin/plans" className="block p-4 hover:bg-gray-700">Subscription Plans</Link></li>
            <li><Link to="/admin/settings" className="block p-4 hover:bg-gray-700">Settings</Link></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;