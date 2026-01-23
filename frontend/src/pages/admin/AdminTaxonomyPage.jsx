import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminTaxonomyPage() {
    const [sigs, setSigs] = useState([]);
    const [fields, setFields] = useState([]);
    const [positions, setPositions] = useState([]);

    const [tab, setTab] = useState("sigs"); // "sigs" | "fields" | "positions"

    const [editItem, setEditItem] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [sigRes, fieldRes, posRes] = await Promise.all([
                api.get("/sigs/"),
                api.get("/profile-fields/"),
                api.get("/positions/")
            ]);
            setSigs(sigRes.data);
            setFields(fieldRes.data);
            setPositions(posRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Generic CRUD
    const handleSave = async (e) => {
        e.preventDefault();
        let endpoint = "/sigs/";
        if (tab === 'fields') endpoint = "/profile-fields/";
        if (tab === 'positions') endpoint = "/positions/";

        const payload = { ...editItem };
        // Clean up
        if (tab === 'fields' && !payload.limit_to_sig) payload.limit_to_sig = null;

        if (tab === 'fields' && payload.label && !payload.key) {
            payload.key = payload.label.toLowerCase().replace(/\s+/g, '_');
        }

        try {
            if (payload.id) {
                await api.put(`${endpoint}${payload.id}/`, payload);
            } else {
                await api.post(endpoint, payload);
            }
            setIsFormOpen(false);
            loadData();
        } catch (err) {
            alert("Failed to save. Ensure unique constraints.");
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        let endpoint = "/sigs/";
        if (tab === 'fields') endpoint = "/profile-fields/";
        if (tab === 'positions') endpoint = "/positions/";

        try {
            await api.delete(`${endpoint}${id}/`);
            loadData();
        } catch (err) {
            alert("Failed to delete.");
        }
    };

    const openCreate = () => {
        if (tab === 'sigs') setEditItem({ name: "", description: "" });
        if (tab === 'positions') setEditItem({ name: "", rank: 10 });
        if (tab === 'fields') setEditItem({ label: "", key: "", field_type: "text", is_required: false, limit_to_sig: "" });
        setIsFormOpen(true);
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-20">
            <h1 className="text-3xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">
                Structure Management
            </h1>

            {/* TABS */}
            <div className="flex gap-4 mb-8 border-b border-white/10 overflow-x-auto">
                <button onClick={() => setTab("sigs")} className={`pb-2 px-4 whitespace-nowrap transition ${tab === 'sigs' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}>
                    SIGs (Teams)
                </button>
                <button onClick={() => setTab("positions")} className={`pb-2 px-4 whitespace-nowrap transition ${tab === 'positions' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}>
                    Positions & Ranks
                </button>
                <button onClick={() => setTab("fields")} className={`pb-2 px-4 whitespace-nowrap transition ${tab === 'fields' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-gray-400'}`}>
                    Profile Fields
                </button>
            </div>

            <button onClick={openCreate} className="mb-6 bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-white flex items-center gap-2">
                <span>+</span> Add New {tab === 'sigs' ? "SIG" : tab === 'positions' ? "Position" : "Field"}
            </button>

            {/* SIGS */}
            {tab === 'sigs' && (
                <div className="grid gap-4">
                    {sigs.map(sig => (
                        <div key={sig.id} className="bg-white/5 p-4 rounded-lg flex items-center justify-between group border border-white/5 hover:border-cyan-500/30">
                            <div>
                                <h3 className="font-bold text-lg text-cyan-400">{sig.name}</h3>
                                <p className="text-gray-400 text-sm">{sig.description || "No description"}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setEditItem(sig); setIsFormOpen(true); }} className="text-cyan-300">Edit</button>
                                <button onClick={() => handleDelete(sig.id)} className="text-red-400">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* POSITIONS */}
            {tab === 'positions' && (
                <div className="grid gap-4">
                    {positions.sort((a, b) => a.rank - b.rank).map(p => (
                        <div key={p.id} className="bg-white/5 p-4 rounded-lg flex items-center justify-between group border border-white/5 hover:border-green-500/30">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs">{p.rank}</span>
                                <h3 className="font-bold text-lg text-white">{p.name}</h3>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setEditItem(p); setIsFormOpen(true); }} className="text-green-300">Edit</button>
                                <button onClick={() => handleDelete(p.id)} className="text-red-400">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* FIELDS */}
            {tab === 'fields' && (
                <div className="grid gap-4">
                    {fields.map(f => (
                        <div key={f.id} className="bg-white/5 p-4 rounded-lg flex items-center justify-between group border border-white/5 hover:border-pink-500/30">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-pink-400">{f.label}</h3>
                                    <span className="text-xs bg-gray-700 px-2 rounded text-gray-300">{f.field_type}</span>
                                    {f.limit_to_sig && (
                                        <span className="text-xs bg-cyan-900 px-2 rounded text-cyan-200 border border-cyan-500/30">
                                            Only: {sigs.find(s => s.id === f.limit_to_sig)?.name || "SIG#" + f.limit_to_sig}
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-500 text-xs font-mono mt-1">Key: {f.key}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setEditItem(f); setIsFormOpen(true); }} className="text-pink-300">Edit</button>
                                <button onClick={() => handleDelete(f.id)} className="text-red-400">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleSave} className="bg-[#111] border border-white/20 p-6 rounded-xl w-full max-w-md space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editItem.id ? "Edit Item" : "Create New Item"}
                        </h2>

                        {tab === 'sigs' && (
                            <>
                                <div><label className="text-xs text-gray-400 block mb-1">Name</label><input required className="w-full bg-black/40 border border-white/20 rounded p-2 text-white" value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} /></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Description</label><textarea className="w-full bg-black/40 border border-white/20 rounded p-2 text-white" value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} /></div>
                            </>
                        )}

                        {tab === 'positions' && (
                            <>
                                <div><label className="text-xs text-gray-400 block mb-1">Position Title</label><input required className="w-full bg-black/40 border border-white/20 rounded p-2 text-white" value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} /></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Rank Order (1=Top)</label><input type="number" required className="w-full bg-black/40 border border-white/20 rounded p-2 text-white" value={editItem.rank} onChange={e => setEditItem({ ...editItem, rank: parseInt(e.target.value) })} /></div>
                            </>
                        )}

                        {tab === 'fields' && (
                            <>
                                <div><label className="text-xs text-gray-400 block mb-1">Label</label><input required className="w-full bg-black/40 border border-white/20 rounded p-2 text-white" value={editItem.label} onChange={e => setEditItem({ ...editItem, label: e.target.value })} /></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Key</label><input className="w-full bg-black/40 border border-white/20 rounded p-2 text-white font-mono text-sm" value={editItem.key} onChange={e => setEditItem({ ...editItem, key: e.target.value })} disabled={!!editItem.id} /></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Type</label><select className="w-full bg-black/40 border border-white/20 rounded p-2 text-white" value={editItem.field_type} onChange={e => setEditItem({ ...editItem, field_type: e.target.value })}><option value="text">Text</option><option value="url">URL Link</option><option value="date">Date</option><option value="number">Number</option><option value="textarea">Long Text</option></select></div>

                                {/* SIG LIMITER */}
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Show Only For SIG (Optional)</label>
                                    <select className="w-full bg-black/40 border border-white/20 rounded p-2 text-white" value={editItem.limit_to_sig || ""} onChange={e => setEditItem({ ...editItem, limit_to_sig: e.target.value ? parseInt(e.target.value) : null })}>
                                        <option value="">-- All Public Profiles --</option>
                                        {sigs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-2 bg-white/5 rounded text-gray-300">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded text-white font-bold">Save</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
