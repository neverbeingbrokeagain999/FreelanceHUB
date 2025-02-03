import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_PERMISSIONS = {
  SUPER_ADMIN: [
    'manage_admins',
    'manage_freelancers',
    'manage_disputes',
    'manage_payments',
    'view_reports',
    'manage_settings'
  ],
  ADMIN: [
    'manage_freelancers',
    'manage_disputes',
    'view_reports'
  ],
  MODERATOR: [
    'manage_disputes',
    'view_reports'
  ]
};

export const useAdminAuth = () => {
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const validateAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Decode JWT token to get user role
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const userRole = decodedToken.role;

        if (!ADMIN_PERMISSIONS[userRole]) {
          navigate('/');
          return;
        }

        setRole(userRole);
        setPermissions(ADMIN_PERMISSIONS[userRole]);
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    validateAdmin();
  }, [navigate]);

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const canAccess = (requiredPermissions) => {
    if (!Array.isArray(requiredPermissions)) {
      requiredPermissions = [requiredPermissions];
    }
    return requiredPermissions.every(perm => hasPermission(perm));
  };

  const isRole = (checkRole) => role === checkRole;

  return {
    role,
    permissions,
    loading,
    hasPermission,
    canAccess,
    isRole,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isAdmin: role === 'ADMIN',
    isModerator: role === 'MODERATOR'
  };
};
