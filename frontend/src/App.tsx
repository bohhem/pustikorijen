import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SuperGuruRoute from './components/auth/SuperGuruRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRegions from './pages/admin/AdminRegions';
import AdminBridgeIssues from './pages/admin/AdminBridgeIssues';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBranches from './pages/admin/AdminBranches';
import Branches from './pages/Branches';
import BranchDetail from './pages/BranchDetail';
import CreateBranch from './pages/CreateBranch';
import PersonList from './pages/PersonList';
import CreatePerson from './pages/CreatePerson';
import PersonDetail from './pages/PersonDetail';
import EditPerson from './pages/EditPerson';
import FamilyTree from './pages/FamilyTree';
import AddPartnership from './pages/AddPartnership';
import AdminBackups from './pages/admin/AdminBackups';

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
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <SuperGuruRoute>
                  <AdminDashboard />
                </SuperGuruRoute>
              }
            />
            <Route
              path="/admin/regions"
              element={
                <SuperGuruRoute>
                  <AdminRegions />
                </SuperGuruRoute>
              }
            />
            <Route
              path="/admin/branches"
              element={
                <SuperGuruRoute>
                  <AdminBranches />
                </SuperGuruRoute>
              }
            />
            <Route
              path="/admin/bridge-issues"
              element={
                <SuperGuruRoute allowedRoles={['SUPER_GURU', 'ADMIN']}>
                  <AdminBridgeIssues />
                </SuperGuruRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <SuperGuruRoute allowedRoles={['SUPER_GURU', 'ADMIN']}>
                  <AdminUsers />
                </SuperGuruRoute>
              }
            />
            <Route
              path="/admin/backups"
              element={
                <SuperGuruRoute allowedRoles={['SUPER_GURU', 'ADMIN']}>
                  <AdminBackups />
                </SuperGuruRoute>
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
              path="/branches/:branchId/persons/:personId"
              element={
                <ProtectedRoute>
                  <PersonDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branches/:branchId/persons/:personId/edit"
              element={
                <ProtectedRoute>
                  <EditPerson />
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
