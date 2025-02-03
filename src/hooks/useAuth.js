import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setError(null);
      } else {
        console.error('Failed to fetch user data');
        localStorage.removeItem('token');
        setUser(null);
        setError('Session expired. Please login again.');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('token');
      setUser(null);
      setError('Network error. Please try again.');
    }
  }
  setLoading(false);
};

    loadUser();
  }, [setUser, setLoading, setError]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setError(null);
        
        // Redirect based on user role
        switch (data.user.role) {
          case 'freelancer':
            navigate('/freelancer-dashboard');
            break;
          case 'client':
            navigate('/client-dashboard');
            break;
          case 'admin':
            navigate('/admin');
            break;
          default:
            navigate('/');
        }
      } else {
        setError(data.message || 'Login failed. Please try again.');
        setUser(null);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setError(null);
        navigate('/edit-profile');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
        setUser(null);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
    navigate('/');
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const clearError = () => {
    setError(null);
  };

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  const refreshToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const response = await fetch('/api/auth/refresh-token', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  };

  // Auto refresh token before expiry
  useEffect(() => {
    if (user) {
      const refreshInterval = setInterval(() => {
        refreshToken();
      }, 14 * 60 * 1000); // Refresh every 14 minutes (assuming 15-minute token expiry)

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    setUser: updateUser,
    isAuthenticated: !!user,
    checkAuth,
    clearError,
    refreshToken
  };
};
