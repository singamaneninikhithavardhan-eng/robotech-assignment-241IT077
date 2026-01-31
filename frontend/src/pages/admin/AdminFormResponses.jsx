import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminFormResponses() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Sorting State
    const [sortField, setSortField] = useState('submitted_at'); // default: newest first
    const [sortOrder, setSortOrder] = useState('desc');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [fRes, rRes] = await Promise.all([
                api.get(`/forms/${id}/`),
                api.get(`/forms/${id}/responses/`)
            ]);
            setForm(fRes.data);
            setResponses(rRes.data);
        } catch (err) {
            navigate("/portal/forms");
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
        setCurrentPage(1); // Reset to first page
    };

    const getSortedResponses = () => {
        return [...responses].sort((a, b) => {
            let valA, valB;

            if (sortField === 'responder') {
                valA = (a.user_details?.profile?.full_name || a.user_details?.username || "").toLowerCase();
                valB = (b.user_details?.profile?.full_name || b.user_details?.username || "").toLowerCase();
            } else if (sortField === 'submitted_at') {
                valA = new Date(a.submitted_at).getTime();
                valB = new Date(b.submitted_at).getTime();
            } else {
                // Sorting by dynamic field data
                valA = String(a.data[sortField] || "").toLowerCase();
                valB = String(b.data[sortField] || "").toLowerCase();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const handleDeleteResponse = async (resId) => {
        if (!window.confirm("Purge this response record from the database?")) return;
        try {
            await api.delete(`/form-responses/${resId}/`);
            fetchData();
        } catch (err) { alert("Purge failed."); }
    };

    const handleExport = async () => {
        try {
            const response = await api.get(`/forms/${id}/export_responses_csv/`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute('download', `${form.title.replace(/\s+/g, '_')}_responses.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert("Export failed.");
        }
    };

    if (loading) return <div className="p-10 text-center text-orange-400 animate-pulse font-black">DECRYPTING RESULTS...</div>;

    const fields = form.fields || [];
    const sortedResponses = getSortedResponses();

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentResponses = sortedResponses.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedResponses.length / itemsPerPage);

    const SortIndicator = ({ field }) => {
        if (sortField !== field) return <span className="opacity-0 group-hover:opacity-30 inline-block ml-1">⇅</span>;
        return <span className="text-orange-400 inline-block ml-1 font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto text-white">
            <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <button onClick={() => navigate("/portal/forms")} className="text-sm text-orange-400 hover:outline mb-4 flex items-center gap-2">← Form Registry</button>
                    <h1 className="text-3xl font-bold font-[Orbitron] text-gray-100">{form.title}</h1>
                    <p className="text-gray-400 mt-2">Acquisition analytics and responder data signals.</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-center shadow-xl backdrop-blur-md">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Signals Detected</p>
                    <p className="text-3xl font-black font-[Orbitron] text-orange-400">{responses.length}</p>
                </div>
                <button
                    onClick={handleExport}
                    className="bg-green-500/10 border border-green-500/50 text-green-400 px-6 py-4 rounded-2xl shadow-xl hover:bg-green-500/20 transition backdrop-blur-md font-bold uppercase text-xs tracking-widest flex flex-col items-center justify-center gap-1 h-full"
                >
                    <span>⬇ CSV</span>
                    <span className="opacity-50 text-[10px]">Export Data</span>
                </button>
            </div>

            <div className="overflow-x-auto bg-[#0a0a0f] border border-white/5 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] scrollbar-thin scrollbar-thumb-orange-600 scrollbar-track-black pb-4">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-white/5 uppercase text-[10px] font-black tracking-widest text-gray-500 border-b border-white/5">
                            <th
                                className="p-6 cursor-pointer hover:text-white transition-colors group"
                                onClick={() => handleSort('responder')}
                            >
                                Responder <SortIndicator field="responder" />
                            </th>
                            {fields.map(f => (
                                <th
                                    key={f.id}
                                    className="p-6 min-w-[200px] cursor-pointer hover:text-white transition-colors group"
                                    onClick={() => handleSort(f.label)}
                                >
                                    {f.label} <SortIndicator field={f.label} />
                                </th>
                            ))}
                            <th
                                className="p-6 cursor-pointer hover:text-white transition-colors group"
                                onClick={() => handleSort('submitted_at')}
                            >
                                Timestamp <SortIndicator field="submitted_at" />
                            </th>
                            <th className="p-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedResponses.length === 0 ? (
                            <tr>
                                <td colSpan={fields.length + 3} className="p-20 text-center text-gray-600 italic uppercase text-xs font-bold tracking-[0.2em]">No signal data detected in this sector.</td>
                            </tr>
                        ) : (
                            currentResponses.map(res => (
                                <tr key={res.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-xs uppercase border border-orange-500/30">
                                                {res.user_details?.username?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-200">{res.user_details?.profile?.full_name || res.user_details?.username || "Anonymous"}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{res.user_details?.profile?.position || "External Entity"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {fields.map(f => (
                                        <td key={f.id} className="p-6 text-sm text-gray-400 font-medium">
                                            <div className="max-w-[400px] truncate group-hover:whitespace-normal group-hover:max-w-none transition-all">
                                                {typeof res.data[f.label] === 'boolean' ? (res.data[f.label] ? '✅ CONFIRMED' : '❌ NEGATIVE') : (res.data[f.label] || '-')}
                                            </div>
                                        </td>
                                    ))}
                                    <td className="p-6 text-[10px] text-gray-600 font-mono font-bold uppercase">
                                        {new Date(res.submitted_at).toLocaleString()}
                                    </td>
                                    <td className="p-6">
                                        <button
                                            onClick={() => handleDeleteResponse(res.id)}
                                            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100"
                                            title="Delete Response"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {sortedResponses.length > itemsPerPage && (
                <div className="flex justify-between items-center mt-6">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedResponses.length)} of {sortedResponses.length}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition uppercase tracking-widest"
                        >
                            Previous
                        </button>
                        <div className="flex items-center px-4 bg-black/40 border border-white/5 rounded-xl text-xs font-mono text-orange-400">
                            Page {currentPage} / {totalPages}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition uppercase tracking-widest"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <p className="mt-6 text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                Data Core Integration Active ● Signal Integrity Verified
            </p>
        </div>
    )
}
