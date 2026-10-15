import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-center">
      <div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-muted mb-4">Page not found</p>
        <a href="/" className="btn btn-primary">Go Home</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analysis" element={<div className="text-center py-12 text-muted">Analysis Workflow - Coming Soon</div>} />
        <Route path="/settings" element={<div className="text-center py-12 text-muted">Settings - Coming Soon</div>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}