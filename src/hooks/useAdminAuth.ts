'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department?: string;
  permissions?: string[];
}

export function useAdminAuth() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const sessionToken = localStorage.getItem('admin_session_token');
      const storedAdmin = localStorage.getItem('admin_user');

      if (!sessionToken) {
        setLoading(false);
        return;
      }

      // Validate session token
      const response = await fetch('/api/admin/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken }),
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        setAdmin(result.admin || JSON.parse(storedAdmin || '{}'));
      } else {
        // Clear invalid session
        localStorage.removeItem('admin_session_token');
        localStorage.removeItem('admin_user');
        setAdmin(null);
      }
    } catch (error) {
      console.error('Admin auth check failed:', error);
      localStorage.removeItem('admin_session_token');
      localStorage.removeItem('admin_user');
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('admin_session_token');

      if (sessionToken) {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: sessionToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('admin_session_token');
      localStorage.removeItem('admin_user');
      setAdmin(null);
      router.push('/admin-login');
    }
  };

  return {
    admin,
    loading,
    logout,
    isAuthenticated: !!admin,
    isSuperAdmin: admin?.role === 'super_admin',
  };
}
