import { createContext, useReducer, useCallback, useContext, useEffect } from 'react';
import { captureException } from '../config/sentry';

// Get initial state from localStorage if available
const getInitialState = () => {
  const savedAuth = localStorage.getItem('auth');
  if (savedAuth) {
    try {
      const parsed = JSON.parse(savedAuth);
      console.log('Loading auth from localStorage:', parsed);
      
      // Normalize roles if they exist
      if (parsed.user?.roles) {
        const normalizedRoles = parsed.user.roles.map(role => role.toLowerCase());
        console.log('Normalized roles:', normalizedRoles);
        parsed.user.roles = normalizedRoles;
      } else {
        console.warn('No roles found in stored user data:', parsed.user);
      }

      const state = {
        ...parsed,
        token: localStorage.getItem('token') // Get token separately
      };
      
      console.log('Initialized auth state:', state);
      return state;
    } catch (error) {
      console.error('Failed to parse auth from localStorage:', error);
    }
  }
  return {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null
  };
};

const initialState = getInitialState();

export const AuthContext = createContext(initialState);

// Save auth state to localStorage
const saveAuthState = (state) => {
  try {
    const { token, ...stateWithoutToken } = state;
    localStorage.setItem('auth', JSON.stringify(stateWithoutToken));
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  } catch (error) {
    console.error('Failed to save auth state:', error);
  }
};

const authReducer = (state, action) => {
  let newState;
  
  switch (action.type) {
    case 'LOGIN_START':
      newState = {
        ...state,
        loading: true,
        error: null
      };
      break;
      
    case 'LOGIN_SUCCESS':
      console.log('LOGIN_SUCCESS action payload:', action.payload);
      console.log('User roles from payload:', action.payload.user.roles);
      
      if (!action.payload.user.roles || !Array.isArray(action.payload.user.roles)) {
        console.error('Invalid roles in LOGIN_SUCCESS payload:', action.payload);
        throw new Error('Invalid user role data in response');
      }

      newState = {
        ...state,
        isAuthenticated: true,
        user: {
          ...action.payload.user,
          roles: [...action.payload.user.roles] // Create a new array to ensure roles are properly copied
        },
        token: action.payload.token,
        loading: false,
        error: null
      };
      
      console.log('New state after LOGIN_SUCCESS:', newState);
      break;
      
    case 'LOGIN_FAILURE':
      newState = {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
      break;
      
    case 'LOGOUT':
      newState = {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      };
      localStorage.removeItem('auth');
      localStorage.removeItem('token');
      break;
      
    case 'UPDATE_USER':
      newState = {
        ...state,
        user: { ...state.user, ...action.payload }
      };
      break;
      
    case 'CLEAR_ERROR':
      newState = {
        ...state,
        error: null
      };
      break;
      
    default:
      return state;
  }

  // Save state to localStorage (except during loading states)
  if (!newState.loading) {
    saveAuthState(newState);
  }
  
  return newState;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: 'LOGIN_START' });

      console.log('Attempting login for:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();
      console.log('Server response:', { status: response.status, data });

      if (!response.ok) {
        // Handle specific status codes
        switch (response.status) {
          case 401:
            throw new Error('Invalid email or password');
          case 403:
            throw new Error('Account is deactivated');
          case 500:
            throw new Error('Server error occurred. Please try again later.');
          default:
            throw new Error(data.message || 'Login failed');
        }
      }

      if (!data.success || !data.token || !data.user) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid server response');
      }
      
      if (!data.user.roles || !Array.isArray(data.user.roles)) {
        console.error('Invalid roles data:', data.user.roles);
        throw new Error('Invalid user role data received');
      }

      // Validate and normalize the roles
      if (!data.user.roles || !Array.isArray(data.user.roles)) {
        console.error('No roles array in response:', data.user);
        throw new Error('Invalid user role data received');
      }

      // Convert roles to lowercase for consistency
      const normalizedRoles = data.user.roles.map(role => role.toLowerCase());
      
      console.log('User roles before dispatch:', normalizedRoles);
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: {
          user: {
            ...data.user,
            roles: normalizedRoles
          },
          token: data.token
        }
      });

      console.log('Auth state after dispatch:', {
        user: data.user,
        roles: normalizedRoles,
        isAuthenticated: true
      });

      return data.user;
    } catch (error) {
      captureException(error, {
        tags: { action: 'login' },
        extra: { email }
      });
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error.message || 'Failed to login. Please try again.'
      });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      captureException(error, {
        tags: { action: 'logout' }
      });
      // Still logout on frontend even if API call fails
      dispatch({ type: 'LOGOUT' });
      throw error;
    }
  }, []);

  const updateUser = useCallback((userData) => {
    try {
      dispatch({ type: 'UPDATE_USER', payload: userData });
    } catch (error) {
      captureException(error, {
        tags: { action: 'update_user' },
        extra: { userData }
      });
      throw error;
    }
  }, []);

  // Helper method to check user role (case-insensitive)
  const hasRole = useCallback((role) => {
    if (!state.user?.roles) return false;
    const normalizedRole = role.toLowerCase();
    return state.user.roles.includes(normalizedRole);
  }, [state.user?.roles]);

  // Helper method to get the base path for the user's current role
  const getRolePath = useCallback(() => {
    if (!state.user?.roles?.length) return '/';
    
    if (state.user.roles.includes('admin')) return '/admin';
    if (state.user.roles.includes('client')) return '/client';
    if (state.user.roles.includes('freelancer')) return '/freelancer';
    
    return '/';
  }, [state.user?.roles]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const signup = useCallback(async (userData) => {
    try {
      dispatch({ type: 'LOGIN_START' });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      const data = await response.json();

      // Validate and normalize roles
      if (!data.user.roles || !Array.isArray(data.user.roles)) {
        throw new Error('Invalid user role data received');
      }

      // Convert roles to lowercase for consistency
      const normalizedRoles = data.user.roles.map(role => role.toLowerCase());
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: {
          user: {
            ...data.user,
            roles: normalizedRoles
          },
          token: data.token
        }
      });

      return data.user;
    } catch (error) {
      captureException(error, {
        tags: { action: 'signup' },
        extra: { userData }
      });
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error.message || 'Failed to signup. Please try again.'
      });
      throw error;
    }
  }, []);

  // Get user's default route based on role
  const getDefaultRoute = useCallback((roles) => {
    if (!Array.isArray(roles)) return '/';
    
    if (roles.includes('admin')) return '/admin/dashboard';
    if (roles.includes('client')) return '/client/dashboard';
    if (roles.includes('freelancer')) return '/freelancer/dashboard';
    
    return '/';
  }, []);

  // Export the route getter so components can use it
  const getHomeRoute = useCallback(() => {
    if (!state.user?.roles) return '/';
    return getDefaultRoute(state.user.roles);
  }, [state.user?.roles, getDefaultRoute]);

  const value = {
    ...state,
    login,
    logout,
    signup,
    updateUser,
    clearError,
    getHomeRoute,
    hasRole,
    getRolePath
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const useAuth = useAuthContext;

export default AuthProvider;
