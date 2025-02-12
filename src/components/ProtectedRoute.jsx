import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  redirectTo = '/login',
  allowUnverified = true,
  onAccessDenied = null,
  loadingFallback = <LoadingSpinner fullScreen />
}) => {
  const location = useLocation();
  const { user, loading, isAuthenticated } = useAuthContext();

  const handleAccessDenied = (message) => {
    if (onAccessDenied) {
      onAccessDenied(message);
    }
  };

  if (loading) {
    return loadingFallback;
  }

  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    handleAccessDenied('Please log in to access this page');
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  // Check for required role
  if (requiredRole) {
    const normalizedRequiredRole = requiredRole.toLowerCase();
    const normalizedUserRoles = user.roles?.map(role => role.toLowerCase()) || [];
    if (!Array.isArray(user.roles) || !normalizedUserRoles.includes(normalizedRequiredRole)) {
      console.error('Access denied - missing required role:', {
        required: requiredRole,
        userRoles: user.roles
      });
      
      handleAccessDenied(`Access denied. You need ${requiredRole} privileges to access this page.`);
      return (
        <Navigate 
          to="/" 
          state={{ 
            error: `Access denied. Required role: ${requiredRole}`,
            from: location.pathname 
          }}
          replace 
        />
      );
    }
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.oneOf(['admin', 'client', 'freelancer', 'ADMIN', 'CLIENT', 'FREELANCER']),
  redirectTo: PropTypes.string,
  allowUnverified: PropTypes.bool,
  onAccessDenied: PropTypes.func,
  loadingFallback: PropTypes.node
};

export const AdminRoute = ({ children, onAccessDenied, ...props }) => {
  return (
    <ProtectedRoute 
      requiredRole="admin" 
      redirectTo="/login"
      allowUnverified={true}
      onAccessDenied={(message) => 
        onAccessDenied?.(message || 'Administrative privileges required.')
      }
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
};

// Higher-order component for client routes
export const ClientRoute = ({ children, onAccessDenied, ...props }) => {
  return (
    <ProtectedRoute
      requiredRole="client"
      redirectTo="/login"
      allowUnverified={true}
      onAccessDenied={(message) =>
        onAccessDenied?.(message || 'Client privileges required.')
      }
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
};

// Higher-order component for freelancer routes
export const FreelancerRoute = ({ children, onAccessDenied, ...props }) => {
  return (
    <ProtectedRoute
      requiredRole="freelancer"
      redirectTo="/login"
      allowUnverified={true}
      onAccessDenied={(message) =>
        onAccessDenied?.(message || 'Freelancer privileges required.')
      }
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
  onAccessDenied: PropTypes.func
};

ClientRoute.propTypes = {
  children: PropTypes.node.isRequired,
  onAccessDenied: PropTypes.func
};

FreelancerRoute.propTypes = {
  children: PropTypes.node.isRequired,
  onAccessDenied: PropTypes.func
};

export default ProtectedRoute;
