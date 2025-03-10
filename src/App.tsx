import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ResetPassword from '@/pages/auth/ResetPassword';
import UpdatePassword from '@/pages/auth/UpdatePassword';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Categories from '@/pages/Categories';
import Locations from '@/pages/Locations';
import Inventory from '@/pages/Inventory';
import Users from '@/pages/Users';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Layout from '@/components/Layout';

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

function App() {
  const { loadUser } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <div className={isDark ? 'dark' : ''}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="categories" element={
              <PrivateRoute adminOnly>
                <Categories />
              </PrivateRoute>
            } />
            <Route path="locations" element={
              <PrivateRoute adminOnly>
                <Locations />
              </PrivateRoute>
            } />
            <Route path="users" element={
              <PrivateRoute adminOnly>
                <Users />
              </PrivateRoute>
            } />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={
              <PrivateRoute adminOnly>
                <Settings />
              </PrivateRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;