import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminAuditLogs() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [eventType, setEventType] = useState("");
  const [deleteDays, setDeleteDays] = useState(""); // For delete input
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const limit = 20;

  const handleExport = async () => {
    try {
      const response = await api.get("/audit-logs/export_csv/", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "audit_logs.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export logs.");
    }
  };

  const handleDeleteLogs = async () => {
    if (!deleteDays) return;
    try {
      const res = await api.post("/audit-logs/delete_old_logs/", { days: deleteDays });
      alert(`Deleted ${res.data.deleted_count} logs.`);
      setShowDeleteConfirm(false);
      setDeleteDays("");
      fetchLogs();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete logs.");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, eventType]);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/audit-logs/", {
        params: { page, limit, eventType },
      });

      // Handle different response structures
      if (Array.isArray(res.data)) {
        // No pagination active on backend
        let filtered = res.data;
        if (eventType) {
          filtered = filtered.filter(l => l.event_type === eventType);
        }
        // Manual client-side pagination since backend isn't paginating
        setTotal(filtered.length);
        const start = (page - 1) * limit;
        setLogs(filtered.slice(start, start + limit));
      } else if (res.data.results) {
        // Standard DRF Pagination
        setLogs(res.data.results);
        setTotal(res.data.count);
      } else if (res.data.data) {
        // Custom envelope (as implied by previous code)
        setLogs(res.data.data);
        setTotal(res.data.total);
      } else {
        setLogs([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Failed to load logs", err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const badgeStyle = (success) =>
    success
      ? "bg-green-500/10 text-green-400 border-green-500/30"
      : "bg-red-500/10 text-red-400 border-red-500/30";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">

      {/* ===== BACK NAV ===== */}
      <button
        onClick={() => navigate("/portal/dashboard")}
        className="text-sm text-cyan-400 hover:underline mb-4 w-fit"
      >
        ← Back to Dashboard
      </button>

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-wide">
            Admin Audit Logs
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Security & authentication activity (read-only)
          </p>
        </div>

        <div className="flex gap-2 items-center mt-4 md:mt-0">
          <button
            onClick={handleExport}
            className="bg-green-500/20 text-green-400 border border-green-500/50 px-4 py-2 rounded-lg text-sm hover:bg-green-500/30 transition font-bold"
          >
            ⬇ Export CSV
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg text-sm hover:bg-red-500/30 transition font-bold"
            >
              🗑 Purge Old
            </button>

            {showDeleteConfirm && (
              <div className="absolute right-0 top-12 bg-[#111] border border-red-500/30 p-4 rounded-xl shadow-2xl z-50 w-64">
                <p className="text-xs text-gray-400 mb-2">Delete logs older than X days:</p>
                <input
                  type="number"
                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-white mb-2 text-sm"
                  placeholder="Days e.g., 30"
                  value={deleteDays}
                  onChange={(e) => setDeleteDays(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1 bg-gray-700 rounded text-xs">Cancel</button>
                  <button onClick={handleDeleteLogs} className="flex-1 py-1 bg-red-600 rounded text-xs font-bold">Purge</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        {/* ===== FILTER ===== */}
        <select
          value={eventType}
          onChange={(e) => {
            setEventType(e.target.value);
            setPage(1);
          }}
          className="
            mt-4 md:mt-0
            bg-gray-900 border border-gray-700
            text-gray-200 px-4 py-2 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-cyan-500
          "
        >
          <option value="">All Events</option>
          <option value="FORGOT_PASSWORD_REQUEST">Forgot Password</option>
          <option value="CHANGE_PASSWORD_REQUEST">Change Password</option>
          <option value="RESET_PASSWORD_SUCCESS">Reset Success</option>
          <option value="RESET_PASSWORD_FAILED">Reset Failed</option>
        </select>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">IP</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-gray-800 hover:bg-gray-800/50 transition"
                  >
                    <td className="px-4 py-3 font-medium">
                      {log.event_type}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {log.email || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {log.ip_address}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs border ${badgeStyle(
                          log.success
                        )}`}
                      >
                        {log.success ? "SUCCESS" : "FAILED"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {log.reason || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MOBILE CARDS (IMPROVED UX) ================= */}
      <div className="md:hidden space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No audit logs found
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-200">
                  {log.event_type}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs border ${badgeStyle(
                    log.success
                  )}`}
                >
                  {log.success ? "SUCCESS" : "FAILED"}
                </span>
              </div>

              {/* DETAILS */}
              <div className="space-y-1 text-sm">
                <div className="flex">
                  <span className="w-20 text-gray-500">Email:</span>
                  <span className="text-gray-300 break-all">
                    {log.email || "-"}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-20 text-gray-500">IP:</span>
                  <span className="text-gray-400">
                    {log.ip_address}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-20 text-gray-500">Reason:</span>
                  <span className="text-gray-400">
                    {log.reason || "-"}
                  </span>
                </div>
              </div>

              {/* FOOTER */}
              <div className="mt-3 text-xs text-gray-500">
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      <div className="flex items-center justify-between mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 transition"
        >
          ← Prev
        </button>

        <span className="text-gray-400 text-sm">
          Page <span className="text-gray-200">{page}</span> of{" "}
          <span className="text-gray-200">{totalPages || 1}</span>
        </span>

        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 transition"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
