import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import CertificatsPage from "@/pages/CertificatsPage";
import Dashboard from "@/pages/Dashboard";
import EmissionsAdmin from "@/pages/EmissionsAdmin";
import Login from "@/pages/Login";
import MaterialsAdmin from "@/pages/MaterialsAdmin";
import ProjectDetail from "@/pages/ProjectDetail";
import ProjectsList from "@/pages/ProjectsList";
import Register from "@/pages/Register";
import ValidacioEmissions from "@/pages/ValidacioEmissions";
import VersionsAdmin from "@/pages/VersionsAdmin";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/certificats" element={<CertificatsPage />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
      </Route>
      <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
        <Route path="/admin/materials" element={<MaterialsAdmin />} />
        <Route path="/admin/versions" element={<VersionsAdmin />} />
      </Route>
      <Route element={<ProtectedRoute requiredRoles={["ADMIN_EMISSIONS"]} />}>
        <Route path="/admin/emissions" element={<EmissionsAdmin />} />
        <Route path="/admin/emissions/validacio" element={<ValidacioEmissions />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
