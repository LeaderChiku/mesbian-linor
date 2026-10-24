'use client';

import { useState } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminDashboard from '@/components/admin/AdminDashboard';

/**
 * Admin Panel Entry Route (/admin)
 *
 * Security & Reload Policy (Phase 4):
 * - Opening /admin displays the admin PIN entry screen.
 * - Entering correct 4-digit PIN authenticates with the server,
 *   sets an HMAC-signed HTTP-only session cookie, and opens the dashboard.
 * - Reloading /admin requires entering the PIN again.
 * - Server endpoints verify session tokens on every single privileged operation.
 */
export default function AdminPage() {
  // Always start unauthenticated on page load or reload
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } finally {
      setIsAuthenticated(false);
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin onAuthenticated={handleAuthenticated} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
