import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductFormPage } from './pages/ProductFormPage';
import { Estimates } from './pages/Estimates';
import { EstimateFormPage } from './pages/EstimateFormPage';
import { EstimatePreview } from './pages/EstimatePreview';
import { NotFound } from './pages/NotFound';



// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/new"
        element={
          <ProtectedRoute>
            <ProductFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id/edit"
        element={
          <ProtectedRoute>
            <ProductFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estimates"
        element={
          <ProtectedRoute>
            <Estimates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estimates/new"
        element={
          <ProtectedRoute>
            <EstimateFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estimates/:id/edit"
        element={
          <ProtectedRoute>
            <EstimateFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estimates/:id/preview"
        element={
          <ProtectedRoute>
            <EstimatePreview />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}