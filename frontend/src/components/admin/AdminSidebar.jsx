import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function AdminSidebar({ user, logout }) {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (path) => location.pathname === path;

    const NavItem = ({ to, icon, label, perm }) => {
        // Permission Check
        if (perm && user && user.role !== 'WEB_LEAD' && (!user.permissions || !user.permissions.includes(perm))) {
            return null;
        }

        return (
            <Link
                to={to}
                className={`
          flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1
          ${isActive(to)
                        ? "bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-400 border-l-4 border-cyan-400"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }
        `}
            >
                <span className="text-xl">{icon}</span>
                {!collapsed && <span className="font-medium text-sm">{label}</span>}
            </Link>
        );
    };

    return (
        <aside
            className={`
        bg-[#090a10] border-r border-white/5 h-screen sticky top-0
        transition-all duration-300 flex flex-col z-20
        ${collapsed ? "w-20" : "w-64"}
      `}
        >
            {/* HEADER */}
            <div className="p-6 flex items-center justify-between">
                {!collapsed && (
                    <h1 className="text-xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        ROBOTECH
                    </h1>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-gray-500 hover:text-white transition"
                >
                    {collapsed ? "»" : "«"}
                </button>
            </div>

            {/* USER SNIPPET */}
            <div className="px-4 mb-6">
                <div className={`p-3 bg-white/5 rounded-xl flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shrink-0">
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* NAV LINKS */}
            <nav className="flex-1 px-2 overflow-y-auto custom-scrollbar">
                <NavItem to="/admin/dashboard" icon="📊" label="Dashboard" />

                <div className="my-4 border-t border-white/5 mx-4" />
                <p className={`px-4 text-xs font-bold text-gray-600 uppercase mb-2 ${collapsed && "hidden"}`}>Management</p>

                <NavItem to="/admin/profile" icon="👤" label="My Profile" />
                <NavItem to="/admin/users" icon="👥" label="Users" perm="can_manage_users" />
                {/* MERGED: Manage SIGs & Profile Fields into one 'Structure' page or just keep separate */}
                <NavItem to="/admin/taxonomy" icon="🏷️" label="SIGs & Fields" perm="can_manage_users" />
                <NavItem to="/admin/roles" icon="🔑" label="Roles" perm="can_manage_users" />
                <NavItem to="/admin/team" icon="🛡️" label="Direct Team" perm="can_manage_team" />

                <div className="my-4 border-t border-white/5 mx-4" />
                <p className={`px-4 text-xs font-bold text-gray-600 uppercase mb-2 ${collapsed && "hidden"}`}>Content</p>

                <NavItem to="/admin/projects" icon="🚀" label="Projects" perm="can_manage_projects" />
                <NavItem to="/admin/events" icon="📅" label="Events" perm="can_manage_events" />
                <NavItem to="/admin/gallery" icon="🖼️" label="Gallery" perm="can_manage_gallery" />
                <NavItem to="/admin/announcements" icon="📢" label="Announcements" perm="can_manage_announcements" />

                <div className="my-4 border-t border-white/5 mx-4" />

                <NavItem to="/admin/sponsorship" icon="🤝" label="Sponsors" />
                <NavItem to="/admin/contactMessages" icon="✉️" label="Messages" />
                <NavItem to="/admin/change-password" icon="🔒" label="Security" />
            </nav>

            {/* FOOTER */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={logout}
                    className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-lg 
            text-red-400 hover:bg-red-500/10 hover:text-red-300 transition
            ${collapsed ? "justify-center" : ""}
          `}
                >
                    <span className="text-xl">🚪</span>
                    {!collapsed && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </aside>
    );
}
