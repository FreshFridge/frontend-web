import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import PublicLayout from "./layouts/PublicLayout";
import AdminUsers from "./pages/AdminUsers";
import Dashboard from "./pages/Dashboard";
import Fridges from "./pages/Fridges";
import Login from "./pages/Login";
import Products from "./pages/Products";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import { useAuth } from "./store/AuthContext";

function App() {
  const { isAuthenticated } = useAuth();

  console.log("isAuthenticated:", isAuthenticated);
  console.log("token:", localStorage.getItem("token"));

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/fridges" element={<Fridges />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
