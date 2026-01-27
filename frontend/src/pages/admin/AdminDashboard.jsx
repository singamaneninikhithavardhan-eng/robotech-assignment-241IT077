import { useNavigate, useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Activity,
  Shield,
  User,
  Rocket,
  Key,
  Users,
  ShieldAlert,
  Calendar,
  Megaphone,
  Image as ImageIcon,
  Mail,
  Handshake,
  Lock,
  FileText,
  ChevronRight,
  ArrowUpRight,
  Briefcase
} from "lucide-react";

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
    <div className="animate-fade-in pb-12">

      {/* ===== HEADER ===== */}
      <div className="mb-12 relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-cyan-900/10 via-transparent to-blue-900/10 border border-white/5">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-[Orbitron] tracking-tight">
          System Overview
        </h1>
        <p className="text-gray-400 mt-3 text-lg font-medium opacity-80">
          Welcome back, <span className="text-cyan-400 font-bold">{user?.profile?.full_name || user?.username || "Admin"}</span>.
        </p>
      </div>

      {/* --- QUICK STATS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Projects"
          value={(user?.projects_info?.member?.length || 0) + (user?.projects_info?.led?.length || 0)}
          icon={Rocket}
          color="cyan"
        />
        <StatCard
          label="My Role"
          value={user?.role === 'WEB_LEAD' ? "Web Lead" : user?.profile?.position || "Member"}
          icon={Shield}
          color="purple"
        />
        <div className="lg:col-span-2">
          <RecruitmentToggleCard />
        </div>
      </div>

      {/* ===== DASHBOARD GRID ===== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

        {/* --- CORE SECTIONS --- */}
        <DashboardCard
          title="Profile"
          icon={User}
          onClick={() => navigate("/portal/profile")}
          accent="text-white"
          color="rgba(255,255,255,0.1)"
        />

        <DashboardCard
          title="Workspaces"
          icon={Rocket}
          onClick={() => navigate("/portal/projects")}
          accent="text-cyan-400"
          color="rgba(6,182,212,0.1)"
        />

        {/* --- MANAGEMENT SECTIONS --- */}
        {hasPermission('can_manage_users') && (
          <DashboardCard
            title="Access"
            icon={Key}
            onClick={() => navigate("/portal/roles")}
            accent="text-purple-400"
            color="rgba(168,85,247,0.1)"
          />
        )}

        {hasPermission('can_manage_users') && (
          <DashboardCard
            title="Personnel"
            icon={Users}
            onClick={() => navigate("/portal/users")}
            accent="text-pink-400"
            color="rgba(236,72,153,0.1)"
          />
        )}

        {hasPermission('can_manage_team') && (
          <DashboardCard
            title="Structure"
            icon={ShieldAlert}
            onClick={() => navigate("/portal/team")}
            accent="text-teal-400"
            color="rgba(20,184,166,0.1)"
          />
        )}

        {/* --- CONTENT SECTIONS --- */}
        {hasPermission('can_manage_team') && (
          <DashboardCard
            title="Recruitment"
            icon={Briefcase}
            onClick={() => navigate("/portal/recruitment")}
            accent="text-orange-400"
            color="rgba(249,115,22,0.1)"
          />
        )}

        {hasPermission('can_manage_events') && (
          <DashboardCard
            title="Events"
            icon={Calendar}
            onClick={() => navigate("/portal/events")}
            accent="text-amber-400"
            color="rgba(245,158,11,0.1)"
          />
        )}

        {hasPermission('can_manage_announcements') && (
          <DashboardCard
            title="Broadcast"
            icon={Megaphone}
            onClick={() => navigate("/portal/announcements")}
            accent="text-emerald-400"
            color="rgba(16,185,129,0.1)"
          />
        )}

        {hasPermission('can_manage_gallery') && (
          <DashboardCard
            title="Media"
            icon={ImageIcon}
            onClick={() => navigate("/portal/gallery")}
            accent="text-blue-400"
            color="rgba(59,130,246,0.1)"
          />
        )}

        {hasPermission('can_manage_messages') && (
          <DashboardCard
            title="Inbox"
            icon={Mail}
            onClick={() => navigate("/portal/contactMessages")}
            accent="text-indigo-400"
            color="rgba(99,102,241,0.1)"
          />
        )}

        {hasPermission('can_manage_sponsorship') && (
          <DashboardCard
            title="Sponsors"
            icon={Handshake}
            onClick={() => navigate("/portal/sponsorship")}
            accent="text-rose-400"
            color="rgba(244,63,94,0.1)"
          />
        )}

        {hasPermission('can_manage_forms') && (
          <DashboardCard
            title="Forms"
            icon={FileText}
            onClick={() => navigate("/portal/forms")}
            accent="text-orange-400"
            color="rgba(249,115,22,0.1)"
          />
        )}

      </div>
    </div>
  );
}

function DashboardCard({ title, icon: Icon, onClick, accent, color }) {
  return (
    <div
      onClick={onClick}
      className={`
        group
        cursor-pointer 
        relative
        bg-[#0d0e14] border border-white/5
        rounded-xl p-4
        transition-all duration-300
        hover:-translate-y-1 hover:border-white/20 hover:shadow-lg
        flex flex-col items-center justify-center gap-3 text-center
        h-32
      `}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)` }}
      />

      <div className={`p-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 ${accent} group-hover:scale-110 transition-transform duration-300 relative z-10`}>
        <Icon size={20} />
      </div>

      <h3 className={`text-sm font-bold ${accent} group-hover:brightness-125 transition-all relative z-10`}>{title}</h3>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, desc }) {
  const themes = {
    cyan: "from-cyan-500/10 to-transparent text-cyan-400 border-cyan-500/20",
    purple: "from-purple-500/10 to-transparent text-purple-400 border-purple-500/20",
    green: "from-green-500/10 to-transparent text-green-400 border-green-500/20"
  };

  return (
    <div className={`bg-gradient-to-br ${themes[color]} border rounded-xl p-4 flex items-center gap-4 shadow-lg shadow-black/20 hover:border-white/20 transition-all duration-300`}>
      <div className={`p-2.5 rounded-lg bg-black/40 border border-white/5 ${themes[color].split(' ')[2]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider opacity-50 mb-0.5">{label}</p>
        <p className="text-xl font-bold font-[Orbitron] tracking-tight">{value}</p>
      </div>
    </div>
  );
}


const RecruitmentToggleCard = () => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    // Mock fetch or real API here if available. 
    // For now using localStorage to persist state for demo
    const stored = localStorage.getItem("recruitment_open");
    setEnabled(stored === "true");
    setLoading(false);
  }, []);

  const toggle = async () => {
    const newState = !enabled;
    setEnabled(newState);
    localStorage.setItem("recruitment_open", newState);

    // TODO: Replace with real API call
    // await api.post("/settings/recruitment", { open: newState });
  };

  return (
    <div className={`bg-gradient-to-br from-green-500/10 to-transparent border ${enabled ? 'border-green-500/50' : 'border-white/10'} rounded-xl p-4 flex items-center gap-4 shadow-lg shadow-black/20 hover:border-white/20 transition-all duration-300 relative overflow-hidden group h-full`}>

      {/* Background Glow */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 bg-green-500/20 blur-[50px] transition-opacity duration-500 ${enabled ? 'opacity-100' : 'opacity-0'}`} />

      <div className={`p-2.5 rounded-lg bg-black/40 border transition-colors duration-300 ${enabled ? 'border-green-500/50 text-green-400' : 'border-white/5 text-gray-500'}`}>
        <Activity size={20} />
      </div>

      <div className="flex-1 z-10 relative">
        <p className="text-[10px] font-black uppercase tracking-wider opacity-50 mb-0.5">Recruitment</p>
        <div className="flex items-center gap-3">
          <p className={`text-xl font-bold font-[Orbitron] tracking-tight transition-colors ${enabled ? 'text-white' : 'text-gray-500'}`}>
            {enabled ? "OPEN" : "CLOSED"}
          </p>
          <button
            onClick={toggle}
            disabled={loading}
            className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 ${enabled ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/10'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
