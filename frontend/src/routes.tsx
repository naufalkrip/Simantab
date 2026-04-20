import { createBrowserRouter, Navigate } from "react-router";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import MemberLogin from "./pages/member/MemberLogin";
import MemberDashboard from "./pages/member/MemberDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/member/login" replace />,
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/admin",
    Component: AdminDashboard,
  },
  {
    path: "/member/login",
    Component: MemberLogin,
  },
  {
    path: "/member/dashboard",
    Component: MemberDashboard,
  },
  {
    path: "/member",
    element: <Navigate to="/member/login" replace />,
  },
]);
