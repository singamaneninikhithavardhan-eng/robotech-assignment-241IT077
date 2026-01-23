import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

// SVG ICONS
const GripIcon = () => (
  <svg className="w-4 h-4 text-gray-500 cursor-move" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
  </svg>
);

export default function AdminTeamPage() {
  const navigate = useNavigate();

  // Data State
  const [allMembers, setAllMembers] = useState([]); // Raw list
  const [groupedMembers, setGroupedMembers] = useState({}); // { "Systems": [members], "Alumni": [members] }
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      // Fetch all users with profiles
      // Assuming this endpoint lists all users/profiles.
      // But we actually need to filter properly. We used /users/list/ or /management/ in other screens.
      // Let's use /management/ as it returns detailed profile info.
      const res = await api.get("/management/");

      // Filter to only those with profiles (or at least filter out superusers if needed, but maybe not)
      // Group by SIG and Alumni status
      const raw = res.data;
      setAllMembers(raw);
      groupData(raw);

    } catch (err) {
      console.error("Failed to load members", err);
    } finally {
      setLoading(false);
    }
  };

  const groupData = (data) => {
    const groups = {};

    // Ensure "Alumni" group exists
    if (!groups["Alumni"]) groups["Alumni"] = [];

    data.forEach(user => {
      const profile = user.profile || {};
      if (profile.is_alumni) {
        if (!groups["Alumni"]) groups["Alumni"] = [];
        groups["Alumni"].push(user);
      } else {
        // Determine SIG
        const sig = profile.sig || "Unassigned";
        if (!groups[sig]) groups[sig] = [];
        groups[sig].push(user);
      }
    });

    // Sort each group by 'order'
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => (a.profile?.order || 0) - (b.profile?.order || 0));
    });

    setGroupedMembers(groups);
  };

  /* ================= DRAG & DROP HANDLERS (Simple Implementation) ================= */
  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleDragStart = (e, member, groupKey, index) => {
    dragItem.current = { item: member, group: groupKey, index };
    e.dataTransfer.effectAllowed = "move";
    // e.target.style.opacity = '0.5'; 
  };

  const handleDragEnter = (e, groupKey, index) => {
    // e.target.style.background = '#ffffff10';
    dragOverItem.current = { group: groupKey, index };
  };

  const handleDragEnd = async (e) => {
    // e.target.style.opacity = '1';
    // e.target.style.background = 'none';

    if (!dragItem.current || !dragOverItem.current) return;

    const source = dragItem.current;
    const dest = dragOverItem.current;

    // Only allow reordering within same group for simplicity
    if (source.group !== dest.group) return;

    // Reorder logic
    const groupKey = source.group;
    const list = [...groupedMembers[groupKey]];

    // Remove from old index
    const [movedItem] = list.splice(source.index, 1);
    // Insert at new index
    list.splice(dest.index, 0, movedItem);

    // Update Local State Optimistically
    const newGroups = { ...groupedMembers, [groupKey]: list };
    setGroupedMembers(newGroups);

    // Prepare Payload: { items: [ { id: <uid>, order: <int> } ... ] }
    // We only update sorting for this group to avoid large payloads
    const payload = list.map((u, idx) => ({
      id: u.id,
      order: idx // 0-based index becomes new order
    }));

    try {
      await api.post("/management/reorder-team/", { items: payload });
      console.log("Reorder saved.");
    } catch (err) {
      console.error("Failed to save order", err);
      // Revert? (Optional: reloadMembers())
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };


  return (
    <div className="animate-fade-in pb-20">
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-500">
            Team Management
          </h1>
          <p className="text-gray-400 mt-1">
            Group members by SIG, manage Alumni, and reorder display.
          </p>
        </div>
        <button onClick={() => navigate("/admin/users")} className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition">
          Manage Users List →
        </button>
      </div>

      {loading && <div className="text-center py-10 text-gray-500">Loading Team Structure...</div>}

      {!loading && Object.entries(groupedMembers).map(([groupName, members]) => (
        members.length > 0 && (
          <div key={groupName} className="mb-8">
            <h2 className={`text-xl font-bold mb-4 border-b border-white/10 pb-2 ${groupName === 'Alumni' ? 'text-yellow-400' : 'text-cyan-400'}`}>
              {groupName} <span className="text-xs text-gray-500 font-normal">({members.length})</span>
            </h2>

            <div className="grid gap-2">
              {members.map((m, index) => (
                <div
                  key={m.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, m, groupName, index)}
                  onDragEnter={(e) => handleDragEnter(e, groupName, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()} // Necessary for drop
                  className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-center gap-4 hover:border-cyan-500/30 transition cursor-grab active:cursor-grabbing"
                >
                  <GripIcon />
                  <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                    {m.profile?.image ? (
                      <img src={m.profile.image} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                        {m.username[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">
                      {m.profile?.full_name || m.username}
                      {m.profile?.is_alumni && <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-400 px-1 rounded">ALUMNI</span>}
                      {!m.profile?.is_public && <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1 rounded">HIDDEN</span>}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {m.profile?.position || "Member"} • {m.email}
                    </div>
                  </div>
                  {/* Edit Shortcut */}
                  <button
                    onClick={() => navigate("/admin/users")} // Ideally prompt to edit modal, but users page is source of truth
                    className="text-xs text-cyan-500 hover:text-cyan-400"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {Object.keys(groupedMembers).length === 0 && !loading && (
        <div className="text-center py-20 text-gray-500">No members found. Add users via User Management.</div>
      )}
    </div>
  );
}
