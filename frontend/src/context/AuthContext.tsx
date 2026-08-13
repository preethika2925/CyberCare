import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, ActiveBreakGlass } from '../types';
import {
  loginWithSupabase,
  verifyOtpWithSupabase,
  fetchActiveBreakGlassWithSupabase
} from '../services/supabaseDataService';
import { api } from '../services/api';

interface PendingOtpData {
  userId: string;
  email: string;
  role: Role;
  demoOtpCode?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  pendingOtp: PendingOtpData | null;
  activeBreakGlass: ActiveBreakGlass[];
  isAuthenticated: boolean;
  isLoading: boolean;
  loginPasswordStep: (identifier: string, password: string, role: Role) => Promise<{ requiresOtp: boolean; demoOtpCode?: string }>;
  verifyOtpStep: (otpCode: string) => Promise<User>;
  resendOtpCode: () => Promise<string | undefined>;
  logoutUser: () => Promise<void>;
  refreshBreakGlass: () => Promise<void>;
  clearPendingOtp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createJwtToken(user: User): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    employeeId: user.employeeId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400
  }));
  const sig = btoa('cybercare_sig');
  return `${header}.${payload}.${sig}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cybercare_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cybercare_token'));
  const [pendingOtp, setPendingOtp] = useState<PendingOtpData | null>(null);
  const [activeBreakGlass, setActiveBreakGlass] = useState<ActiveBreakGlass[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (user && token) {
        if (user.role === 'DOCTOR' || user.role === 'ADMIN') {
          refreshBreakGlass();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const refreshBreakGlass = async () => {
    if (!user || !user.doctor) return;
    try {
      const activeList = await fetchActiveBreakGlassWithSupabase(user.doctor.id);
      setActiveBreakGlass(activeList);
    } catch (err) {
      try {
        const res = await api.get('/break-glass/active');
        setActiveBreakGlass(res.data.activeBreakGlass || []);
      } catch (e) {
        // Fallback catch
      }
    }
  };

  useEffect(() => {
    if (user && (user.role === 'DOCTOR' || user.role === 'ADMIN')) {
      const interval = setInterval(() => {
        refreshBreakGlass();
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loginPasswordStep = async (identifier: string, password: string, role: Role) => {
    try {
      const res = await loginWithSupabase(identifier, password, role);
      setPendingOtp({
        userId: res.userId,
        email: res.email,
        role: res.role,
        demoOtpCode: res.demoOtpCode
      });
      return { requiresOtp: true, demoOtpCode: res.demoOtpCode };
    } catch (err: any) {
      const res = await api.post('/auth/login', { identifier, password, role });
      const data = res.data;
      setPendingOtp({
        userId: data.userId,
        email: data.email,
        role: data.role,
        demoOtpCode: data.demoOtpCode
      });
      return { requiresOtp: true, demoOtpCode: data.demoOtpCode };
    }
  };

  const verifyOtpStep = async (otpCode: string): Promise<User> => {
    if (!pendingOtp) throw new Error('No pending OTP session');
    let newUser: User;

    try {
      newUser = await verifyOtpWithSupabase(pendingOtp.userId, otpCode);
    } catch (err) {
      const res = await api.post('/auth/verify-otp', {
        userId: pendingOtp.userId,
        otpCode
      });
      newUser = res.data.user;
    }

    const jwtToken = createJwtToken(newUser);
    setToken(jwtToken);
    setUser(newUser);
    localStorage.setItem('cybercare_token', jwtToken);
    localStorage.setItem('cybercare_user', JSON.stringify(newUser));
    setPendingOtp(null);

    if (newUser.role === 'DOCTOR' || newUser.role === 'ADMIN') {
      refreshBreakGlass();
    }

    return newUser;
  };

  const resendOtpCode = async () => {
    if (!pendingOtp) return;
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setPendingOtp(prev => prev ? { ...prev, demoOtpCode: generatedOtp } : null);
    return generatedOtp;
  };

  const logoutUser = async () => {
    localStorage.removeItem('cybercare_token');
    localStorage.removeItem('cybercare_user');
    setToken(null);
    setUser(null);
    setPendingOtp(null);
    setActiveBreakGlass([]);
  };

  const clearPendingOtp = () => setPendingOtp(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        pendingOtp,
        activeBreakGlass,
        isAuthenticated: !!token && !!user,
        isLoading,
        loginPasswordStep,
        verifyOtpStep,
        resendOtpCode,
        logoutUser,
        refreshBreakGlass,
        clearPendingOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
