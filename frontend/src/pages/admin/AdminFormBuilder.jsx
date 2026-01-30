import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const FIELD_TYPES = [
    { value: 'text', label: 'Short Text', icon: '📝' },
    { value: 'textarea', label: 'Long Text', icon: '📄' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'date', label: 'Date', icon: '📅' },
    { value: 'select', label: 'Dropdown', icon: '🔽' },
    { value: 'radio', label: 'Radio Buttons', icon: '🔘' },
    { value: 'checkbox', label: 'Checkbox', icon: '✅' },
];

const THEMES = [
    { value: 'cyberpunk', label: 'Cyberpunk Neon' },
    { value: 'minimal', label: 'Minimalist Glass' },
    { value: 'industrial', label: 'Industrial Steel' },
    { value: 'academic', label: 'Academic Official' },
    { value: 'solaris', label: 'Solaris Vivid' },
    { value: 'midnight', label: 'Midnight Indigo' },
];

export default function AdminFormBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);

    // Editor State
    const [isEditingMeta, setIsEditingMeta] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const [editSuccessMsg, setEditSuccessMsg] = useState("");
    const [editSuccessLink, setEditSuccessLink] = useState("");
    const [editSuccessLinkLabel, setEditSuccessLinkLabel] = useState("");

    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [activeSectionId, setActiveSectionId] = useState(null);

    const [newFieldName, setNewFieldName] = useState("");
    const [newFieldType, setNewFieldType] = useState("text");
    const [isRequired, setIsRequired] = useState(false);
    const [optionsList, setOptionsList] = useState([""]);

    // Field Editing State
    const [editingFieldId, setEditingFieldId] = useState(null);
    const [editLabel, setEditLabel] = useState("");
    const [editType, setEditType] = useState("text");
    const [editRequired, setEditRequired] = useState(false);
    const [editOptions, setEditOptions] = useState([""]);

    useEffect(() => {
        fetchForm();
    }, [id]);

    const fetchForm = async () => {
        try {
            const res = await api.get(`/forms/${id}/`);
            setForm(res.data);
            setEditTitle(res.data.title);
            setEditDescription(res.data.description);
            setEditSuccessMsg(res.data.success_message || "Your response has been integrated. Session terminates now.");
            setEditSuccessLink(res.data.success_link || "");
            setEditSuccessLinkLabel(res.data.success_link_label || "Continue");

            if (res.data.sections?.length > 0 && !activeSectionId) {
                setActiveSectionId(res.data.sections[0].id);
            }
        } catch (err) {
            navigate("/portal/forms");
        } finally {
            setLoading(false);
        }
    };

    const handleThemeChange = async (theme) => {
        try {
            await api.patch(`/forms/${id}/`, { theme });
            fetchForm();
        } catch (err) { alert("Theme update failed"); }
    };

    const handleUpdateMeta = async () => {
        try {
            await api.patch(`/forms/${id}/`, {
                title: editTitle,
                description: editDescription,
                success_message: editSuccessMsg,
                success_link: editSuccessLink,
                success_link_label: editSuccessLinkLabel
            });
            setIsEditingMeta(false);
            fetchForm();
        } catch (err) { alert("Failed to update form details"); }
    };

    const handleAddSection = async () => {
        if (!newSectionTitle.trim()) return;
        try {
            const res = await api.post("/form-sections/", {
                form: id,
                title: newSectionTitle,
                order: form.sections.length
            });
            setNewSectionTitle("");
            setActiveSectionId(res.data.id);
            fetchForm();
        } catch (err) { alert("Failed to add section"); }
    };

    const handleAddField = async () => {
        if (!newFieldName.trim() || !activeSectionId) return;

        let options = [];
        if (['select', 'radio', 'checkbox'].includes(newFieldType)) {
            options = optionsList.map(o => o.trim()).filter(o => o);
        }

        try {
            await api.post("/form-fields/", {
                form: id,
                section: activeSectionId,
                label: newFieldName,
                field_type: newFieldType,
                required: isRequired,
                options: options,
                order: form.fields.filter(f => f.section === activeSectionId).length
            });
            setNewFieldName("");
            setIsRequired(false);
            setOptionsList([""]);
            fetchForm();
        } catch (err) { alert("Failed to add field"); }
    };

    const handleDeleteField = async (fieldId) => {
        try {
            await api.delete(`/form-fields/${fieldId}/`);
            fetchForm();
        } catch (err) { alert("Failed to delete field"); }
    };

    const handleDeleteSection = async (secId) => {
        if (!window.confirm("Delete this entire page/section and all its fields?")) return;
        try {
            await api.delete(`/form-sections/${secId}/`);
            if (activeSectionId === secId) setActiveSectionId(null);
            fetchForm();
        } catch (err) { alert("Failed to delete section"); }
    };

    const handleMoveField = async (field, direction) => {
        const currentFields = form.fields
            .filter(f => f.section === activeSectionId)
            .sort((a, b) => a.order - b.order);

        const idx = currentFields.findIndex(f => f.id === field.id);
        if (idx === -1) return;
        const targetIdx = idx + direction;

        if (targetIdx < 0 || targetIdx >= currentFields.length) return;

        const targetField = currentFields[targetIdx];

        try {
            // Swap orders
            // If orders are identical (legacy data), enforce index-based reordering
            let newOrderCurrent = targetField.order;
            let newOrderTarget = field.order;

            if (newOrderCurrent === newOrderTarget) {
                newOrderCurrent = targetIdx;
                newOrderTarget = idx;
            }

            await Promise.all([
                api.patch(`/form-fields/${field.id}/`, { order: newOrderCurrent }),
                api.patch(`/form-fields/${targetField.id}/`, { order: newOrderTarget })
            ]);

            fetchForm();
        } catch (err) { alert("Reorder failed"); }
    };

    const handleToggleActive = async () => {
        try {
            await api.patch(`/forms/${id}/`, { is_active: !form.is_active });
            fetchForm();
        } catch (err) { alert("Toggle failed"); }
    };

    const handleUpdateDeadline = async (date) => {
        try {
            await api.patch(`/forms/${id}/`, { closes_at: date });
            fetchForm();
        } catch (err) { alert("Deadline update failed"); }
    };

    const handleStartEdit = (field) => {
        setEditingFieldId(field.id);
        setEditLabel(field.label);
        setEditType(field.field_type);
        setEditRequired(field.required);
        setEditOptions(field.options && field.options.length > 0 ? [...field.options] : [""]);
    };

    const handleCancelEdit = () => {
        setEditingFieldId(null);
        setEditLabel("");
        setEditType("text");
        setEditRequired(false);
        setEditOptions([""]);
    };

    const handleUpdateField = async () => {
        if (!editLabel.trim()) return;

        let options = [];
        if (['select', 'radio', 'checkbox'].includes(editType)) {
            options = editOptions.map(o => o.trim()).filter(o => o);
        }

        try {
            await api.patch(`/form-fields/${editingFieldId}/`, {
                label: editLabel,
                field_type: editType,
                required: editRequired,
                options: options
            });
            handleCancelEdit();
            fetchForm();
        } catch (err) { alert("Failed to update field"); }
    };

    if (loading) return <div className="p-10 text-center text-orange-400 animate-pulse font-black uppercase tracking-widest">Constructing Interface...</div>;

    const hasOptions = ['select', 'radio', 'checkbox'].includes(newFieldType);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto text-white">
            {/* HEADER & CONTROLS */}
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="flex-1">
                    <button onClick={() => navigate("/portal/forms")} className="text-sm text-orange-400 hover:outline mb-4 flex items-center gap-2">← Navigator</button>
                    {isEditingMeta ? (
                        <div className="space-y-3 max-w-2xl bg-[#0a0a0f] p-6 rounded-2xl border border-white/10">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Primary Metadata</h3>
                            <input
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xl font-bold font-[Orbitron] text-white focus:border-orange-500 outline-none"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                placeholder="Form Title"
                            />
                            <textarea
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-gray-300 focus:border-orange-500 outline-none h-24"
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                placeholder="Description"
                            />

                            <div className="pt-4 border-t border-white/5 mt-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Post-Submission Actions</h3>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-gray-300 focus:border-orange-500 outline-none h-20 mb-2"
                                    value={editSuccessMsg}
                                    onChange={e => setEditSuccessMsg(e.target.value)}
                                    placeholder="Success Message (e.g. Thanks for submitting...)"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-orange-500 outline-none"
                                        value={editSuccessLink}
                                        onChange={e => setEditSuccessLink(e.target.value)}
                                        placeholder="Redirect Link (https://...)"
                                    />
                                    <input
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-orange-500 outline-none"
                                        value={editSuccessLinkLabel}
                                        onChange={e => setEditSuccessLinkLabel(e.target.value)}
                                        placeholder="Link Button Label"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button onClick={handleUpdateMeta} className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-bold uppercase transition">Save Configuration</button>
                                <button onClick={() => setIsEditingMeta(false)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold uppercase transition">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative">
                            <h1 className="text-4xl font-bold font-[Orbitron] text-gray-100 flex items-center gap-3">
                                {form.title}
                                <button onClick={() => setIsEditingMeta(true)} className="opacity-0 group-hover:opacity-100 text-sm text-gray-500 hover:text-orange-400 transition" title="Edit details">✏️</button>
                            </h1>
                            <p className="text-gray-500 mt-2 max-w-2xl">{form.description}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* AUTO CLOSURE */}
                    <div className="bg-[#1a1a20] p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Auto-Closure Terminal</label>
                        <input
                            type="datetime-local"
                            className="bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-orange-400 outline-none"
                            value={form.closes_at ? new Date(form.closes_at).toISOString().slice(0, 16) : ""}
                            onChange={(e) => handleUpdateDeadline(e.target.value)}
                        />
                    </div>

                    {/* MANUAL TOGGLE */}
                    <div
                        onClick={handleToggleActive}
                        className={`cursor-pointer group relative overflow-hidden px-8 py-4 rounded-2xl border transition-all flex flex-col items-center justify-center min-w-[160px] ${form.is_active ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                    >
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${form.is_active ? 'text-green-400' : 'text-red-400'}`}>
                            {form.is_active ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                        </span>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${form.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="absolute bottom-1 text-[8px] opacity-0 group-hover:opacity-40 uppercase font-bold text-white">Click to Toggle</span>
                    </div>
                </div>
            </div>

            {/* AESTHETIC THEME SELECTOR */}
            <div className="mb-10 p-6 bg-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-3 px-2">Aesthetic Synthesis (Theme)</label>
                <div className="flex flex-wrap gap-2">
                    {THEMES.map(t => (
                        <button
                            key={t.value}
                            onClick={() => handleThemeChange(t.value)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${form.theme === t.value ? 'bg-orange-600 border-orange-500 shadow-lg shadow-orange-600/20' : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* PAGE / SECTION SIDEBAR */}
                <div className="space-y-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Navigation Pages</h3>
                    <div className="flex flex-col gap-2">
                        {form.sections?.map((sec, idx) => (
                            <div
                                key={sec.id}
                                onClick={() => setActiveSectionId(sec.id)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${activeSectionId === sec.id ? 'bg-orange-600/10 border-orange-500/50 text-orange-400' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}
                            >
                                <span className="font-bold text-sm truncate uppercase tracking-tighter">Page {idx + 1}: {sec.title}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSection(sec.id); }}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-125 transition-all text-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-dashed border-white/10">
                            <input
                                className="w-full bg-transparent border-none text-xs font-bold uppercase outline-none placeholder-gray-700 mb-3"
                                placeholder="New Page Title..."
                                value={newSectionTitle}
                                onChange={e => setNewSectionTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddSection()}
                            />
                            <button
                                onClick={handleAddSection}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all"
                            >
                                + Add Page
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN EDITOR AREA */}
                <div className="lg:col-span-3 space-y-8">
                    {activeSectionId ? (
                        <>
                            <div className="bg-[#111] overflow-hidden rounded-3xl border border-white/5 shadow-2xl transition-all">
                                <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-1">Editing Page Architecture</h2>
                                        <p className="text-2xl font-bold font-[Orbitron] uppercase tracking-tighter">
                                            {form.sections.find(s => s.id === activeSectionId)?.title}
                                        </p>
                                    </div>
                                    <div className="text-[10px] font-black text-gray-600 uppercase border border-white/10 px-3 py-2 rounded-lg">
                                        Active Signal Group
                                    </div>
                                </div>
                                <div className="p-8 space-y-6 min-h-[400px]">
                                    {form.fields.filter(f => f.section === activeSectionId).map((field, idx) => (
                                        editingFieldId === field.id ? (
                                            <div key={field.id} className="bg-[#1a1a20] border border-orange-500/50 rounded-2xl p-6 relative">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-orange-400 font-bold uppercase text-xs tracking-widest">Editing Field #{idx + 1}</span>
                                                    <div className="flex gap-2">
                                                        <button onClick={handleUpdateField} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold uppercase transition">Save</button>
                                                        <button onClick={handleCancelEdit} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs font-bold uppercase transition">Cancel</button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] text-gray-500 font-bold uppercase mb-2">Label</label>
                                                        <input
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-orange-500 outline-none text-white"
                                                            value={editLabel}
                                                            onChange={e => setEditLabel(e.target.value)}
                                                        />
                                                        <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={editRequired}
                                                                onChange={e => setEditRequired(e.target.checked)}
                                                                className="accent-orange-500"
                                                            />
                                                            <span className="text-[10px] text-gray-500 font-bold uppercase">Mandatory</span>
                                                        </label>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-gray-500 font-bold uppercase mb-2">Type</label>
                                                        <select
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-orange-500 outline-none text-white uppercase font-bold"
                                                            value={editType}
                                                            onChange={e => setEditType(e.target.value)}
                                                        >
                                                            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                                                        </select>

                                                        {['select', 'radio', 'checkbox'].includes(editType) && (
                                                            <div className="mt-3 space-y-2">
                                                                <label className="block text-[8px] font-black text-orange-500 uppercase tracking-widest">Options</label>
                                                                {editOptions.map((opt, optIdx) => (
                                                                    <div key={optIdx} className="flex gap-2">
                                                                        <input
                                                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:border-orange-500 outline-none text-gray-300"
                                                                            value={opt}
                                                                            onChange={e => {
                                                                                const newOpts = [...editOptions];
                                                                                newOpts[optIdx] = e.target.value;
                                                                                setEditOptions(newOpts);
                                                                            }}
                                                                        />
                                                                        <button
                                                                            onClick={() => setEditOptions(editOptions.filter((_, i) => i !== optIdx))}
                                                                            className="text-red-500 hover:text-red-400 px-2"
                                                                        >✕</button>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={() => setEditOptions([...editOptions, ""])}
                                                                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] uppercase font-bold text-gray-400"
                                                                >+ Add Option</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={field.id} className="bg-black/40 border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                                                <div className="flex items-center gap-6">
                                                    <span className="text-gray-800 font-black text-xl italic">{String(idx + 1).padStart(2, '0')}</span>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-bold text-gray-100">{field.label}</h4>
                                                            {field.required && <span className="text-[8px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded font-black uppercase tracking-widest">Required</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{field.field_type}</span>
                                                            {field.options?.length > 0 && <span className="text-[10px] text-gray-500 italic">Options: {field.options.join(', ')}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMoveField(field, -1); }}
                                                        className="p-1 hover:text-orange-400 text-gray-600"
                                                        title="Move Up"
                                                    >
                                                        ▲
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMoveField(field, 1); }}
                                                        className="p-1 hover:text-orange-400 text-gray-600"
                                                        title="Move Down"
                                                    >
                                                        ▼
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleStartEdit(field); }}
                                                        className="p-2 text-gray-600 hover:text-blue-400 hover:scale-110 transition-all"
                                                        title="Edit Field"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteField(field.id)}
                                                        className="p-2 text-gray-600 hover:text-red-500 hover:scale-110 transition-all"
                                                        title="Delete Field"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                    {form.fields.filter(f => f.section === activeSectionId).length === 0 && (
                                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-30">
                                            <span className="text-4xl mb-4">🧱</span>
                                            <p className="text-xs font-black uppercase tracking-[0.3em] font-[Orbitron]">Blueprint Empty</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* FIELD CREATOR FOOTER */}
                            <div className="bg-[#1a1a20] border border-white/10 p-8 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-3">Field Designation</label>
                                    <input
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:border-orange-500 outline-none transition"
                                        placeholder="Question label..."
                                        value={newFieldName}
                                        onChange={e => setNewFieldName(e.target.value)}
                                    />
                                    <label className="flex items-center gap-3 mt-4 cursor-pointer group">
                                        <input type="checkbox" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} className="accent-orange-500" />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase group-hover:text-white transition-colors">Mandatory Signal</span>
                                    </label>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-3">Modular Logic</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:border-orange-500 outline-none transition uppercase font-black"
                                        value={newFieldType}
                                        onChange={e => setNewFieldType(e.target.value)}
                                    >
                                        {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                                    </select>
                                    {hasOptions && (
                                        <div className="mt-4 space-y-3">
                                            <label className="block text-[8px] font-black text-orange-500 uppercase tracking-widest px-1">Configure Selection Nodes</label>

                                            <div className="space-y-2">
                                                {optionsList.map((opt, idx) => (
                                                    <div key={idx} className="flex gap-2 group/opt">
                                                        <input
                                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-xs focus:border-orange-500 outline-none transition-all"
                                                            placeholder={`Option ${idx + 1}...`}
                                                            value={opt}
                                                            onChange={e => {
                                                                const newList = [...optionsList];
                                                                newList[idx] = e.target.value;
                                                                setOptionsList(newList);
                                                            }}
                                                        />
                                                        {optionsList.length > 1 && (
                                                            <button
                                                                onClick={() => setOptionsList(optionsList.filter((_, i) => i !== idx))}
                                                                className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-xs"
                                                            >✕</button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => setOptionsList([...optionsList, ""])}
                                                className="w-full py-3 bg-white/5 border border-dashed border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-orange-500/50 hover:text-orange-400 transition-all"
                                            >
                                                + Add Response Signal
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleAddField}
                                    className="md:col-span-1 bg-white text-black font-black py-4 rounded-2xl hover:bg-orange-600 hover:text-white transition-all uppercase tracking-widest text-xs shadow-xl"
                                >
                                    Deploy Field
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-20 bg-white/5 rounded-[40px] border-2 border-dashed border-white/10">
                            <span className="text-6xl mb-8 animate-bounce">📑</span>
                            <h2 className="text-2xl font-bold font-[Orbitron] uppercase text-gray-400">Initialize Navigation Page</h2>
                            <p className="text-gray-600 mt-2 text-center max-w-sm">Every form needs at least one page to hold data collection modules. Create a page in the navigation drawer to begin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
