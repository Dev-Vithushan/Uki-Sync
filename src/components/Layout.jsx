import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/board", label: "Board" }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const canManageUsers = user?.role === "Admin" || user?.role === "Lecturer";
  const visibleNavItems = canManageUsers ? [...navItems, { to: "/users", label: "Users" }] : navItems;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-chip">UkiSync</span>
          <p className="brand-subtitle">Student Task Orchestration</p>
        </div>

        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link--active" : "sidebar-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <h1 className="topbar-title">{user?.role} Workspace</h1>
            <p className="topbar-subtitle">
              Signed in as <strong>{user?.name}</strong> ({user?.email})
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
