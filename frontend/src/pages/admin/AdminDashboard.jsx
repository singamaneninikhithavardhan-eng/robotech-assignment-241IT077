import { useNavigate, useOutletContext } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Safely get context
  const context = useOutletContext();
  const user = context?.user;

  /* ================= PERMISSION HELPER ================= */
  const hasPermission = (perm) => {
    if (!user) return false;
    if (user.role === 'WEB_LEAD') return true;

    return user.permissions && user.permissions.includes(perm);
  };

  return (
    <div className="animate-fade-in">

      {/* ===== HEADER ===== */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 font-[Orbitron]">
          Admin Dashboard
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Welcome back, {user?.profile?.full_name || user?.username || "Admin"}.
        </p>
      </div>

      {/* ===== DASHBOARD GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

        {/* --- PROFILE (QUICK LINK) --- */}
        <DashboardCard
          title="My Profile"
          desc="Update your personal details & photo."
          icon="👤"
          onClick={() => navigate("/admin/profile")}
          accent="text-cyan-400"
          border="hover:border-cyan-500/50"
        />

        {/* --- ROLES (NEW) --- */}
        {hasPermission('can_manage_users') && (
          <DashboardCard
            title="Roles & Permissions"
            desc="Create roles and set access levels."
            icon="🔑"
            onClick={() => navigate("/admin/roles")}
            accent="text-purple-400"
            border="hover:border-purple-500/50"
          />
        )}

        {/* --- USERS --- */}
        {hasPermission('can_manage_users') && (
          <DashboardCard
            title="User Management"
            desc="Manage admins and assign roles."
            icon="👥"
            onClick={() => navigate("/admin/users")}
            accent="text-pink-400"
            border="hover:border-pink-500/50"
          />
        )}

        {/* --- TEAM --- */}
        {hasPermission('can_manage_team') && (
          <DashboardCard
            title="Team & Members"
            desc="Manage exec board and members."
            icon="🛡️"
            onClick={() => navigate("/admin/team")}
            accent="text-teal-400"
            border="hover:border-teal-500/50"
          />
        )}

        {/* --- PROJECTS --- */}
        {hasPermission('can_manage_projects') && (
          <DashboardCard
            title="Projects"
            desc="Manage portfolio projects."
            icon="🚀"
            onClick={() => navigate("/admin/projects")}
            accent="text-cyan-400"
            border="hover:border-cyan-500/50"
          />
        )}

        {/* --- EVENTS --- */}
        {hasPermission('can_manage_events') && (
          <DashboardCard
            title="Events"
            desc="Competitions and registrations."
            icon="📅"
            onClick={() => navigate("/admin/events")}
            accent="text-purple-400"
            border="hover:border-purple-500/50"
          />
        )}

        {/* --- ANNOUNCEMENTS --- */}
        {hasPermission('can_manage_announcements') && (
          <DashboardCard
            title="Announcements"
            desc="Public news and updates."
            icon="📢"
            onClick={() => navigate("/admin/announcements")}
            accent="text-emerald-400"
            border="hover:border-emerald-500/50"
          />
        )}

        {/* --- GALLERY --- */}
        {hasPermission('can_manage_gallery') && (
          <DashboardCard
            title="Gallery"
            desc="Photo and video gallery."
            icon="🖼️"
            onClick={() => navigate("/admin/gallery")}
            accent="text-blue-400"
            border="hover:border-blue-500/50"
          />
        )}

        {/* --- MESSAGES --- */}
        <DashboardCard
          title="Messages"
          desc="Inquiries from Contact Us page."
          icon="✉️"
          onClick={() => navigate("/admin/contactMessages")}
          accent="text-indigo-400"
          border="hover:border-indigo-500/50"
        />

        {/* --- SPONSORSHIP --- */}
        <DashboardCard
          title="Sponsors"
          desc="Sponsorship requests and leads."
          icon="🤝"
          onClick={() => navigate("/admin/sponsorship")}
          accent="text-rose-400"
          border="hover:border-rose-500/50"
        />

        {/* --- SECURITY --- */}
        <DashboardCard
          title="Security"
          desc="Password and access logs."
          icon="🔒"
          onClick={() => navigate("/admin/change-password")}
          accent="text-yellow-400"
          border="hover:border-yellow-500/50"
        />

      </div>
    </div>
  );
}

function DashboardCard({ title, desc, icon, onClick, accent, border }) {
  return (
    <div
      onClick={onClick}
      className={`
        group
        cursor-pointer 
        relative
        bg-white/5 backdrop-blur-md
        border border-white/5 ${border}
        rounded-2xl p-6
        transition-all duration-300
        hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl
        flex flex-col h-full
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-black/40 text-2xl ${accent}`}>
          {icon}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
          ↗
        </div>
      </div>

      <h3 className={`text-xl font-semibold mb-2 ${accent} group-hover:brightness-110`}>{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
