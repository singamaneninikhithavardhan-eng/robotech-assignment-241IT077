import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminUsersPage() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [sigs, setSigs] = useState([]);
    const [fields, setFields] = useState([]);
    const [positions, setPositions] = useState([]); // NEW

    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editUserId, setEditUserId] = useState(null);

    const [form, setForm] = useState({
        username: "", email: "", password: "",
        role: "CANDIDATE", role_ids: [],
        full_name: "", position: "", team_name: "",
        year: "", branch: "", sig: "",
        is_active: true, is_public: true, is_alumni: false,
        custom_fields: {}
    });

    const [image, setImage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deleteId, setDeleteId] = useState(null);

    /* ================= LOAD DATA ================= */
    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, rolesRes, sigsRes, fieldsRes, posRes] = await Promise.all([
                api.get("/management/"),
                api.get("/roles/"),
                api.get("/sigs/"),
                api.get("/profile-fields/"),
                api.get("/positions/")
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
            setSigs(sigsRes.data);
            setFields(fieldsRes.data);
            setPositions(posRes.data.sort((a, b) => a.rank - b.rank));
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    /* ================= FORM LOGIC ================= */
    const handleEdit = (user) => {
        setIsEditing(true);
        setEditUserId(user.id);
        setForm({
            username: user.username,
            email: user.email,
            password: "",
            role: user.role,
            role_ids: user.user_roles ? user.user_roles.map(r => r.id) : [],
            full_name: user.profile?.full_name || "",
            position: user.profile?.position || "",
            team_name: user.profile?.team_name || "",
            year: user.profile?.year || "",
            branch: user.profile?.branch || "",
            sig: user.profile?.sig || "",
            is_active: user.is_active,
            is_public: user.profile?.is_public !== false,
            is_alumni: user.profile?.is_alumni || false,
            custom_fields: user.profile?.custom_fields || {}
        });
        setImage(null);
        setFormOpen(true);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (k === 'role_ids') v.forEach(id => fd.append('role_ids', id));
                else if (k === 'custom_fields') fd.append(k, JSON.stringify(v));
                else fd.append(k, v);
            });
            if (image) fd.append('image', image);

            isEditing ? await api.put(`/management/${editUserId}/`, fd) : await api.post("/management/", fd);
            setFormOpen(false);
            loadData();
        } catch (err) {
            setError(err.response?.data?.error || "Operation failed.");
        } finally {
            setSaving(false);
        }
    };

    // Filter Fields based on selected SIG
    const visibleFields = fields.filter(f => {
        // Show if no limit is set
        if (!f.limit_to_sig) return true;
        // Or if limit matches selected SIG ID
        // Note: form.sig is the SIG Name string (legacy compat), but limit_to_sig is ID.
        // We need to match Name -> ID
        const selectedSigObj = sigs.find(s => s.name === form.sig);
        return selectedSigObj && f.limit_to_sig === selectedSigObj.id;
    });

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-[Orbitron] text-cyan-400">User Management</h1>
                <div className="flex gap-2">
                    <button onClick={() => navigate("/admin/taxonomy")} className="bg-white/10 px-4 py-2 rounded text-sm hover:bg-white/20">⚙️ Structure</button>
                    <button onClick={() => { setIsEditing(false); setFormOpen(true); setForm({ ...form, username: "", password: "" }); }} className="bg-cyan-500 px-4 py-2 rounded text-black font-bold">+ New User</button>
                </div>
            </div>

            {/* TABLE */}
            <div className="glass overflow-auto rounded-xl">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-cyan-400">
                        <tr><th className="p-4">User</th><th className="p-4">Role/Position</th><th className="p-4 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-white/5">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-xs">{u.username[0]}</div>
                                    <div>
                                        <div className="font-bold">{u.profile?.full_name || u.username}</div>
                                        <div className="text-xs text-gray-400">{u.profile?.sig || "No SIG"}</div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm bg-white/10 px-2 py-1 rounded border border-white/10">{u.profile?.position || "Member"}</span>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleEdit(u)} className="text-cyan-400 hover:text-white mr-2">Edit</button>
                                    <button onClick={() => { setDeleteId(u.id); }} className="text-red-400 hover:text-white">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {formOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="glass w-full max-w-2xl p-6 rounded-xl my-10 relative">
                        <button onClick={() => setFormOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
                        <h2 className="text-2xl font-bold mb-6">{isEditing ? "Edit User" : "Add User"}</h2>

                        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div><label className="text-xs text-gray-400">Username</label><input required disabled={isEditing} className="w-full bg-black/40 border border-white/20 rounded p-2 text-white" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
                                <div><label className="text-xs text-gray-400">Password</label><input type="password" className="w-full bg-black/40 border border-white/20 rounded p-2 text-white" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>

                                <div><label className="text-xs text-gray-400">SIG Assignment</label>
                                    <select className="w-full bg-black/40 border border-white/20 rounded p-2 text-white" value={form.sig} onChange={e => setForm({ ...form, sig: e.target.value })}>
                                        <option value="">-- No SIG --</option>
                                        {sigs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select></div>

                                <div><label className="text-xs text-gray-400">Position</label>
                                    <select className="w-full bg-black/40 border border-white/20 rounded p-2 text-white" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
                                        <option value="">-- Select Position --</option>
                                        {/* Managed Positions */}
                                        {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                        {/* Fallback to existing value if not in list */}
                                        {form.position && !positions.find(p => p.name === form.position) && <option value={form.position}>{form.position} (Legacy)</option>}
                                    </select></div>
                            </div>

                            <div className="space-y-4">
                                <div><label className="text-xs text-gray-400">Full Name</label><input className="w-full bg-black/40 border border-white/20 rounded p-2 text-white" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-2 rounded"><input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} /> <span className="text-xs">Public</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-2 rounded"><input type="checkbox" checked={form.is_alumni} onChange={e => setForm({ ...form, is_alumni: e.target.checked })} /> <span className="text-xs">Alumni</span></label>
                                </div>

                                {/* DYNAMIC FIELDS section */}
                                {visibleFields.length > 0 && (
                                    <div className="bg-white/5 p-3 rounded border border-white/10 mt-2">
                                        <h4 className="text-xs font-bold text-cyan-400 mb-2 uppercase">
                                            {form.sig ? `${form.sig} Only Fields` : "Extra Fields"}
                                        </h4>
                                        {visibleFields.map(f => (
                                            <div key={f.key} className="mb-2">
                                                <label className="text-[10px] text-gray-400 block mb-1">{f.label}</label>
                                                <input className="w-full bg-black/40 border-b border-white/20 text-white text-sm focus:border-cyan-400 outline-none pb-1"
                                                    value={form.custom_fields[f.key] || ""}
                                                    onChange={e => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button type="submit" disabled={saving} className="col-span-1 md:col-span-2 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded font-bold text-white hover:opacity-90">{saving ? "Saving..." : "Save User"}</button>
                        </form>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#111] border border-red-500/30 p-6 rounded-xl text-center">
                        <h3 className="text-red-500 font-bold text-xl mb-4">Confirm Delete?</h3>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteId(null)} className="py-2 px-4 bg-gray-700 rounded">Cancel</button>
                            <button onClick={async () => { await api.delete(`/management/${deleteId}/`); setDeleteId(null); loadData(); }} className="py-2 px-4 bg-red-600 rounded">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
