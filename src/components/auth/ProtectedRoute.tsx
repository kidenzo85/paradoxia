import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  console.log('ProtectedRoute:', { user, loading, adminOnly }); // Debug log
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }
  
  if (!user) {
    console.log('No user, redirecting to login'); // Debug log
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly) {
    console.log('Admin check:', user.email); // Debug log
    if (user.email !== 'fabricewilliam73@gmail.com') {
      console.log('Not admin, redirecting to home'); // Debug log
      return <Navigate to="/" replace />;
    }
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;