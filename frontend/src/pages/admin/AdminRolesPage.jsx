import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminRolesPage() {
    const navigate = useNavigate();

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // New Role Form
    const [isAdding, setIsAdding] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");

    const PERMISSIONS = [
        { key: "can_manage_users", label: "Manage Users & Roles" },
        { key: "can_manage_projects", label: "Manage Projects" },
        { key: "can_manage_events", label: "Manage Events" },
        { key: "can_manage_team", label: "Manage Team Members" },
        { key: "can_manage_gallery", label: "Manage Gallery" },
        { key: "can_manage_announcements", label: "Manage Announcements" },
    ];

    /* ================= LOAD DATA ================= */
    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const res = await api.get("/roles/");
            setRoles(res.data);
        } catch (err) {
            console.error("Failed to load roles", err);
        } finally {
            setLoading(false);
        }
    };

    /* ================= ACTIONS ================= */
    const handleAddRole = async (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;

        try {
            setSaving(true);
            await api.post("/roles/", { name: newRoleName });
            setNewRoleName("");
            setIsAdding(false);
            loadRoles();
        } catch (err) {
            alert("Failed to create role");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePermission = async (role, permKey) => {
        // Optimistic UI update
        const updatedRoles = roles.map((r) => {
            if (r.id === role.id) {
                return { ...r, [permKey]: !r[permKey] };
            }
            return r;
        });
        setRoles(updatedRoles);

        try {
            await api.patch(`/roles/${role.id}/`, {
                [permKey]: !role[permKey],
            });
        } catch (err) {
            console.error("Failed to update permission", err);
            loadRoles(); // Revert on failure
        }
    };

    const handleDeleteRole = async (id) => {
        if (!window.confirm("Are you sure you want to delete this role?")) return;
        try {
            await api.delete(`/roles/${id}/`);
            loadRoles();
        } catch (err) {
            alert("Failed to delete role");
        }
    };

    return (
        <div className="min-h-screen text-white p-6 sm:p-10 max-w-7xl mx-auto">

            {/* ===== HEADER ===== */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                <div>
                    <button
                        onClick={() => navigate("/admin/dashboard")}
                        className="text-sm text-cyan-400 hover:underline mb-2"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                        Roles & Permissions
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Create dynamic roles and control their access levels.
                    </p>
                </div>

                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-bold transition shadow-lg shadow-pink-500/20"
                >
                    + Create New Role
                </button>
            </div>

            {/* ===== ROLE LIST ===== */}
            {loading ? (
                <div className="text-gray-400">Loading roles...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className="bg-[#0f111a] border border-white/5 rounded-xl p-6 hover:border-pink-500/30 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-semibold text-white">
                                    {role.name}
                                </h3>
                                <button
                                    onClick={() => handleDeleteRole(role.id)}
                                    className="text-gray-500 hover:text-red-400 transition"
                                    title="Delete Role"
                                >
                                    🗑️
                                </button>
                            </div>

                            <div className="space-y-3">
                                {PERMISSIONS.map((perm) => (
                                    <label
                                        key={perm.key}
                                        className="flex items-center justify-between cursor-pointer group"
                                    >
                                        <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                                            {perm.label}
                                        </span>
                                        <div
                                            className={`w-10 h-6 rounded-full p-1 transition-colors ${role[perm.key] ? "bg-pink-500" : "bg-gray-700"
                                                }`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleTogglePermission(role, perm.key);
                                            }}
                                        >
                                            <div
                                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${role[perm.key] ? "translate-x-4" : "translate-x-0"
                                                    }`}
                                            />
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ===== ADD ROLE MODAL ===== */}
            {isAdding && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0f111a] border border-white/10 rounded-xl p-6 w-full max-w-sm animate-scale-in">
                        <h2 className="text-xl font-bold mb-4">Create Role</h2>

                        <form onSubmit={handleAddRole}>
                            <div className="mb-6">
                                <label className="block text-xs uppercase text-gray-500 mb-1">
                                    Role Name
                                </label>
                                <input
                                    autoFocus
                                    className="w-full bg-black/40 border border-white/20 rounded p-3 text-white focus:border-pink-500 outline-none"
                                    placeholder="e.g. Co-Convenor"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 py-2 rounded bg-white/5 hover:bg-white/10 text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-2 rounded bg-pink-500 hover:bg-pink-600 text-white font-bold"
                                >
                                    {saving ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
