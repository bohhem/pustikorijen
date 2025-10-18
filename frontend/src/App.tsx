import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Branches from './pages/Branches';
import BranchDetail from './pages/BranchDetail';
import CreateBranch from './pages/CreateBranch';
import PersonList from './pages/PersonList';
import CreatePerson from './pages/CreatePerson';
import FamilyTree from './pages/FamilyTree';
import AddPartnership from './pages/AddPartnership';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/branches" element={<Branches />} />
            <Route path="/branches/:id" element={<BranchDetail />} />
            <Route
              path="/branches/create"
              element={
                <ProtectedRoute>
                  <CreateBranch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branches/:branchId/persons"
              element={
                <ProtectedRoute>
                  <PersonList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branches/:branchId/persons/create"
              element={
                <ProtectedRoute>
                  <CreatePerson />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branches/:branchId/tree"
              element={
                <ProtectedRoute>
                  <FamilyTree />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branches/:branchId/partnerships/add"
              element={
                <ProtectedRoute>
                  <AddPartnership />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
