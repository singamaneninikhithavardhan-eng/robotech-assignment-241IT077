import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import api from "../../api/axios";

// Icons
const TaskIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01" /></svg>;
const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const DiscussionIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>;
const DeadlineIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const isUserOnline = (lastLogin) => {
    if (!lastLogin) return false;
    const diff = (new Date() - new Date(lastLogin)) / 1000 / 60; // minutes
    return diff < 60;
};

export default function ProjectDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useOutletContext();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [seenMessageIds, setSeenMessageIds] = useState(new Set());
    const [allUsers, setAllUsers] = useState([]);
    const [unreadMsgIds, setUnreadMsgIds] = useState(new Set());

    useEffect(() => {
        if (user) {
            api.get("/management/").then(res => setAllUsers(res.data)).catch(err => console.error(err));
        }
    }, [user]);

    const activeTab = searchParams.get("tab") || "overview";
    const setActiveTab = (tab) => {
        setSearchParams({ tab });
    };

    useEffect(() => {
        loadProject();
    }, [id]);

    const loadProject = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const res = await api.get(`/projects/${id}/`);
            const data = res.data;

            // Notification Logic
            // Notification Logic
            if (isSilent && data.threads) {
                const newSeen = new Set(seenMessageIds);
                const newUnread = new Set(unreadMsgIds);
                let updateUnread = false;

                const currentThreadId = parseInt(searchParams.get("thread"));

                data.threads.forEach(thread => {
                    thread.messages?.forEach(m => {
                        if (!newSeen.has(m.id)) {
                            // It's a new message!
                            if (m.author !== user.id) {
                                if (Notification.permission === "granted") {
                                    new Notification(`New Signal: #${thread.title}`, {
                                        body: `${m.author_details?.username}: ${m.content.substring(0, 50)}${m.content.length > 50 ? '...' : ''}`,
                                        icon: '/favicon.ico'
                                    });
                                }

                                // Clean logic: If not currently looking at this thread, mark likely unread
                                if (activeTab !== 'discussions' || currentThreadId !== thread.id) {
                                    newUnread.add(m.id);
                                    updateUnread = true;
                                }
                            }
                            newSeen.add(m.id);
                        }
                    });
                });

                setSeenMessageIds(newSeen);
                if (updateUnread) setUnreadMsgIds(newUnread);

            } else if (!isSilent && data.threads) {
                // Initialize seen IDs on first load
                const initialIds = new Set();
                data.threads.forEach(t => t.messages?.forEach(m => initialIds.add(m.id)));
                setSeenMessageIds(initialIds);
            }

            setProject(data);
        } catch (err) {
            console.error(err);
            if (!isSilent) navigate("/portal/projects");
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    // Adaptive Polling Logic (Traffic Control)
    useEffect(() => {
        // Spin Down: If no user session, do not start engine
        if (!user) return;

        let timeoutId;
        let isMount = true;

        const poll = async () => {
            // Stop polling if not active or tab hidden (Browser API)
            if (document.hidden || !project) {
                timeoutId = setTimeout(poll, 10000); // Slow down significantly when hidden
                return;
            }

            try {
                // Lightweight Sync Call
                const res = await api.get(`/projects/${id}/sync_state/`);
                const { members_status, threads_state } = res.data;

                // State Update Logic
                setProject(prev => {
                    if (!prev) return null;

                    // Diffing logic
                    const membersChanged = prev.members_details?.some(m => members_status[m.id] && members_status[m.id] !== m.last_login);
                    const leadChanged = prev.lead_details && members_status[prev.lead_details.id] !== prev.lead_details.last_login;

                    let updatedMembers = prev.members_details;
                    let updatedLead = prev.lead_details;

                    if (membersChanged) {
                        updatedMembers = prev.members_details.map(m => ({ ...m, last_login: members_status[m.id] || m.last_login }));
                    }
                    if (leadChanged) {
                        updatedLead = { ...prev.lead_details, last_login: members_status[prev.lead_details.id] || prev.lead_details.last_login };
                    }

                    // Thread Logic
                    let needsThreadReload = false;
                    if (activeTab === 'discussions') {
                        prev.threads?.forEach(t => {
                            const serverLastMsgId = threads_state[t.id] || 0;
                            const localLastMsgId = t.messages?.length > 0 ? t.messages[t.messages.length - 1].id : 0;
                            if (serverLastMsgId !== localLastMsgId) needsThreadReload = true;
                        });
                    }

                    if (needsThreadReload) {
                        loadProject(true);
                        return prev;
                    }

                    if (membersChanged || leadChanged) {
                        return { ...prev, members_details: updatedMembers, lead_details: updatedLead };
                    }
                    return prev; // No re-render if nothing changed
                });

                // Normal Pace: 5 seconds
                timeoutId = setTimeout(poll, 5000);

            } catch (err) {
                // Kill Switch: If Auth fails (401/403), stop polling completely
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    console.warn("Session expired. Stopping sync.");
                    return;
                }

                console.error("Sync failed, backing off", err);
                // Error Backoff: 15 seconds
                timeoutId = setTimeout(poll, 15000);
            }
        };

        // Start the loop
        timeoutId = setTimeout(poll, 5000);

        return () => {
            isMount = false;
            clearTimeout(timeoutId);
        };
    }, [id, activeTab, project, user]);

    // Clear unread when viewing thread
    useEffect(() => {
        const currentThreadId = parseInt(searchParams.get("thread"));
        if (activeTab === 'discussions' && currentThreadId && project && unreadMsgIds.size > 0) {
            const thread = project.threads.find(t => t.id === currentThreadId);
            if (thread) {
                const newUnread = new Set(unreadMsgIds);
                let changed = false;
                thread.messages.forEach(m => {
                    if (newUnread.has(m.id)) {
                        newUnread.delete(m.id);
                        changed = true;
                    }
                });
                if (changed) setUnreadMsgIds(newUnread);
            }
        }
    }, [activeTab, searchParams, project]);

    // Request Notification Permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    if (loading) return <div className="p-10 text-center text-cyan-500 animate-pulse">Initializing Workspace...</div>;
    if (!project) return null;

    const isMember = project.members.includes(user.id) || project.lead === user.id || user.is_superuser;

    if (!isMember) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="bg-white/5 border border-white/10 p-8 rounded-xl max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold font-[Orbitron] text-white">Restricted Access</h2>
                    <p className="text-gray-400">This workspace is restricted to team members only.</p>

                    <RequestAccessButton project={project} user={user} />

                    <button onClick={() => navigate("/portal/projects")} className="text-sm text-cyan-400 hover:underline block w-full pt-4">← Back to Overview</button>
                </div>
            </div>
        );
    }

    return (
        <div className="text-white">
            {/* Header Area */}
            <div className="mb-8">
                <button onClick={() => navigate("/portal/projects")} className="text-sm text-cyan-400 hover:underline mb-4 block">← All Projects</button>
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${project.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                project.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}>{project.status.replace("_", " ")}</span>
                            {project.deadline && (
                                <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                                    <DeadlineIcon /> {new Date(project.deadline).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl font-bold font-[Orbitron] text-gray-100">{project.title}</h1>
                        <p className="text-gray-400 mt-2 max-w-2xl">{project.description}</p>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Project Lead</p>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-cyan-900 flex items-center justify-center text-[10px] font-bold">{project.lead_details?.username?.[0]}</div>
                                <span className="text-sm font-medium text-gray-200">{project.lead_details?.profile?.full_name || project.lead_details?.username || "Unassigned"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/10 mb-8 overflow-x-auto no-scrollbar pt-2">
                <TabButton id="overview" label="Overview" icon="📊" active={activeTab} set={setActiveTab} />
                <TabButton id="tasks" label="Timeline & Tasks" icon="📑" active={activeTab} set={setActiveTab} />
                <TabButton
                    id="discussions"
                    label="Threads"
                    icon="💬"
                    active={activeTab}
                    set={setActiveTab}
                    badge={unreadMsgIds.size > 0 ? unreadMsgIds.size : null}
                />
                <TabButton id="team" label="Team" icon="👥" active={activeTab} set={setActiveTab} />
                {(user.is_superuser || project.lead === user.id) && (
                    <TabButton id="manage" label="Management" icon="⚙️" active={activeTab} set={setActiveTab} />
                )}
            </div>

            {/* Content */}
            <div className="min-h-[500px]">
                {activeTab === 'overview' && <OverviewTab project={project} />}
                {activeTab === 'tasks' && <TasksTab project={project} user={user} allUsers={allUsers} onUpdate={loadProject} />}
                {activeTab === 'discussions' && <DiscussionsTab project={project} user={user} onUpdate={loadProject} unreadMsgIds={unreadMsgIds} setUnreadMsgIds={setUnreadMsgIds} />}
                {activeTab === 'team' && <TeamTab project={project} user={user} allUsers={allUsers} onUpdate={loadProject} />}
                {activeTab === 'manage' && <ManagementTab project={project} allUsers={allUsers} onUpdate={loadProject} />}
            </div>
        </div>
    );
}

function TabButton({ id, label, icon, active, set, badge }) {
    const isActive = active === id;
    return (
        <button
            onClick={() => set(id)}
            className={`px-6 py-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-all relative ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
                }`}
        >
            <span>{icon}</span>
            <span>{label}</span>
            {badge && (
                <span className="bg-red-500 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center -ml-1 animate-bounce">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
            {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
        </button>
    );
}

// --- SUB-COMPONENTS ---

function OverviewTab({ project }) {
    const completedTasks = project.tasks?.filter(t => t.status === 'DONE').length || 0;
    const totalTasks = project.tasks?.length || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4 font-[Orbitron] text-cyan-400">Completion Status</h3>
                    <div className="relative h-4 bg-black/40 rounded-full overflow-hidden border border-white/10">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-400">
                        <span>{completedTasks} / {totalTasks} Tasks Resolved</span>
                        <span className="font-bold text-cyan-400">{progress}%</span>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4 font-[Orbitron] text-cyan-400">Mission Brief</h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{project.description}</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Milestones</h3>
                    <div className="space-y-4">
                        {project.tasks?.slice(0, 5).map(t => (
                            <div key={t.id} className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${t.status === 'DONE' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`} />
                                <span className={`text-sm ${t.status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{t.title}</span>
                            </div>
                        ))}
                        {totalTasks === 0 && <p className="text-gray-600 text-xs italic">No milestones defined.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TasksTab({ project, user, allUsers, onUpdate }) {
    const [newTask, setNewTask] = useState({ title: "", due_date: "", requirements: "", assigned_to: "" });
    const [showAdd, setShowAdd] = useState(false);

    // Filter potential assignees to only project members and lead
    const assignableUsers = [project.lead_details, ...(project.members_details || [])].filter(Boolean);
    // Ensure uniqueness just in case
    const uniqueAssignable = Array.from(new Map(assignableUsers.map(u => [u.id, u])).values());

    const handleAdd = async () => {
        if (!newTask.title) return;
        try {
            await api.post("/tasks/", { ...newTask, project: project.id });
            setNewTask({ title: "", due_date: "", requirements: "", assigned_to: "" });
            setShowAdd(false);
            onUpdate();
        } catch (err) { alert("Failed"); }
    }

    const isLead = project.lead === user.id || user.is_superuser;

    return (
        <div className="space-y-6">
            {isLead && (
                <div className="flex justify-end">
                    <button onClick={() => setShowAdd(!showAdd)} className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded text-xs font-bold uppercase transition-all">
                        {showAdd ? 'Cancel' : '+ Deploy Task'}
                    </button>
                </div>
            )}

            {showAdd && (
                <div className="bg-[#1a1a20] border border-cyan-500/30 rounded-xl p-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input className="bg-black/40 border border-white/10 rounded p-2 text-sm" placeholder="Task Objective..." value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                        <div className="grid grid-cols-2 gap-2">
                            <input type="date" className="bg-black/40 border border-white/10 rounded p-2 text-sm text-gray-400" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} />
                            <select className="bg-black/40 border border-white/10 rounded p-2 text-sm text-gray-400" value={newTask.assigned_to} onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}>
                                <option value="">Unassigned</option>
                                {uniqueAssignable.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                            </select>
                        </div>
                    </div>
                    <textarea className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm mb-4 h-24" placeholder="Requirements & Technical Details..." value={newTask.requirements} onChange={e => setNewTask({ ...newTask, requirements: e.target.value })} />
                    <button onClick={handleAdd} className="bg-cyan-500 text-black px-6 py-2 rounded font-bold hover:bg-cyan-400 transition-all">Submit Assignment</button>
                </div>
            )}

            <div className="space-y-3">
                {project.tasks?.map(t => (
                    <div key={t.id} className="bg-white/5 border border-white/5 rounded-lg p-4 flex items-center justify-between group hover:border-white/20 transition-all">
                        <div className="flex items-center gap-4">
                            <div
                                onClick={async () => {
                                    if (!isLead && t.assigned_to !== user.id) return;
                                    await api.patch(`/tasks/${t.id}/`, { status: t.status === 'DONE' ? 'TODO' : 'DONE' });
                                    onUpdate();
                                }}
                                className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-all ${t.status === 'DONE' ? 'bg-green-500 border-green-500' : 'border-white/20 bg-black/20 hover:border-cyan-500'
                                    }`}
                            >
                                {t.status === 'DONE' && <span className="text-black text-xs font-black">✓</span>}
                            </div>
                            <div>
                                <h4 className={`font-bold transition-all ${t.status === 'DONE' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{t.title}</h4>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                                    {t.assigned_to_details ? `Assigned to: ${t.assigned_to_details.username}` : "Unassigned"}
                                </p>
                                {t.requirements && <p className="text-sm text-gray-400 mt-2 whitespace-pre-wrap">{t.requirements}</p>}
                            </div>
                        </div>
                        {t.due_date && <span className="text-xs text-red-500 font-mono">DEADLINE: {t.due_date}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

function DiscussionsTab({ project, user, onUpdate, unreadMsgIds, setUnreadMsgIds }) {
    const [msg, setMsg] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const activeThreadId = parseInt(searchParams.get("thread"));

    const setActiveThreadId = (tid) => {
        // Clear unread for this thread
        if (tid && unreadMsgIds.size > 0) {
            const threadMessages = project.threads.find(t => t.id === tid)?.messages || [];
            const newUnread = new Set(unreadMsgIds);
            threadMessages.forEach(m => newUnread.delete(m.id));
            setUnreadMsgIds(newUnread);
        }

        const params = new URLSearchParams(searchParams);
        if (tid) params.set("thread", tid);
        else params.delete("thread");
        setSearchParams(params);
    };

    const handleCreateThread = async () => {
        const title = prompt("Thread Subject:");
        if (!title) return;
        try {
            const res = await api.post("/threads/", { title, project: project.id });
            setActiveThreadId(res.data.id);
            onUpdate(true);
        } catch (err) { alert("Failed to deploy channel."); }
    }

    const handleSendMsg = async (e) => {
        e.preventDefault();
        if (!msg.trim() || !activeThreadId) return;
        try {
            const res = await api.post("/messages/", { content: msg, thread: activeThreadId });
            setMsg("");

            // Manual local update to avoid full reload
            onUpdate(false); // Don't trigger full reload
            // Manually append message to state (Optimistic-ish / Instant feedback)
            // But actually we should let the poller pick it up OR inject it.
            // Better: trigger a single thread refresh or just let next poll handle it?
            // User expects instant feedback. Let's force a lightweight sync immediately or just inject.
            // Since we have setProject in parent, we can't easily inject deep.
            // Compromise: Force a "thread-only" reload or just wait for poll? 
            // Wait for poll is laggy. Let's call loadProject(true) aka silent reload for now 
            // BUT we just optimized loadProject away.
            // Fix: We need to inject the new message into the project state.
            // Passed down props don't allow easy deep mutation.
            // Fallback: trigger silent reload (the old way) is safe but heavy.
            // New way: Call Sync immediately.
            // We can't easily trigger the poll effect manually.
            // Simplest safe approach:
            onUpdate(true); // Triggers full loadProject(true) which is now the fallback for heavy updates.
            // Wait, we optimized the poller, but loadProject is still available for manual actions!
        } catch (err) { console.error(err); }
    }

    const handleToggleEphemeral = async (id) => {
        try {
            await api.post(`/threads/${id}/toggle_ephemeral/`);
            onUpdate();
        } catch (err) { alert("Logic failure."); }
    }

    const handlePurgeMessages = async (id) => {
        if (!window.confirm("Purge History: Permanently delete ALL messages in this node?")) return;
        try {
            await api.post(`/threads/${id}/purge_messages/`);
            onUpdate();
        } catch (err) { alert("Wipe failed."); }
    }

    const handleDeleteThread = async (id) => {
        if (!window.confirm("Nuclear Option: Archive this entire channel?")) return;
        try {
            await api.delete(`/threads/${id}/`);
            if (activeThreadId === id) setActiveThreadId(null);
            onUpdate();
        } catch (err) { alert("Failed."); }
    }

    const currentThread = project.threads?.find(t => t.id === activeThreadId);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[600px]">
            {/* Sidebar */}
            <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col backdrop-blur-md">
                <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Communication Nodes</span>
                    <button onClick={handleCreateThread} className="w-8 h-8 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-xl hover:bg-cyan-600 hover:text-white transition-all">+</button>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                    {project.threads?.map(t => (
                        <div key={t.id} className="group relative">
                            <button
                                onClick={() => setActiveThreadId(t.id)}
                                className={`w-full text-left p-3 rounded-lg text-xs transition-all flex flex-col gap-1 ${activeThreadId === t.id ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
                            >
                                <span className={`${activeThreadId === t.id ? 'font-bold' : ''}`}># {t.title}</span>
                                {(() => {
                                    const unreadCount = t.messages?.filter(m => unreadMsgIds.has(m.id)).length || 0;
                                    return unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 rounded-full ml-auto">
                                            {unreadCount}
                                        </span>
                                    );
                                })()}
                                {t.is_ephemeral && <span className={`text-[8px] font-black uppercase tracking-widest ${activeThreadId === t.id ? 'text-cyan-200' : 'text-orange-500'}`}>⚡ Ephemeral</span>}
                            </button>
                            <button
                                onClick={() => handleDeleteThread(t.id)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[10px] text-red-500 hover:scale-125 transition-all"
                            >✕</button>
                        </div>
                    ))}
                    {!project.threads?.length && <p className="text-gray-700 text-center text-[10px] mt-10 p-4 italic uppercase tracking-widest">No signals detected.</p>}
                </div>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-3 bg-white/5 border border-white/10 rounded-xl flex flex-col overflow-hidden relative">
                {currentThread ? (
                    <>
                        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="font-[Orbitron] font-bold text-gray-200 uppercase tracking-tighter"># {currentThread.title}</h3>
                                {currentThread.is_ephemeral && <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest animate-pulse mt-1">Self-Destruct Protocol Active: Messages expire in 1 hour</p>}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handlePurgeMessages(currentThread.id)}
                                    className="text-[8px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-all"
                                >
                                    Wipe History
                                </button>
                                <button
                                    onClick={() => handleToggleEphemeral(currentThread.id)}
                                    className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${currentThread.is_ephemeral ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                                >
                                    {currentThread.is_ephemeral ? 'Disable Ephemerality' : 'Enable Ephemerality'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-black/20" ref={r => r && (r.scrollTop = r.scrollHeight)}>
                            {currentThread.messages?.map(m => (
                                <div key={m.id} className={`flex flex-col ${m.author === user.id ? 'items-end' : 'items-start'} animate-slide-in`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-bold flex items-center gap-1.5 ${m.author === user.id ? 'text-cyan-400' : 'text-gray-500'}`}>
                                            {m.author_details?.username}
                                            {m.author !== user.id && (
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${isUserOnline(m.author_details?.last_login) ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-gray-600'}`}
                                                    title={isUserOnline(m.author_details?.last_login) ? 'Online' : 'Offline'}
                                                />
                                            )}
                                        </span>
                                        <span className="text-[8px] text-gray-700 font-mono">
                                            {new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm max-w-[75%] leading-relaxed shadow-xl ${m.author === user.id ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-white/5 text-gray-100 border border-white/5 rounded-tl-none'}`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {!currentThread.messages?.length && (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 scale-150">
                                    <span className="text-4xl mb-4">🛡️</span>
                                    <p className="text-[8px] font-black uppercase tracking-[0.4em]">Channel Dark</p>
                                </div>
                            )}
                            {/* Dummy element to scroll to */}
                            <div ref={el => el?.scrollIntoView({ behavior: 'smooth' })} />
                        </div>

                        <form onSubmit={handleSendMsg} className="p-6 bg-black/40 border-t border-white/10 flex gap-4">
                            <input
                                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-cyan-500 transition-all font-medium"
                                placeholder={`Transmit to #${currentThread.title}...`}
                                value={msg}
                                onChange={e => setMsg(e.target.value)}
                            />
                            <button className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all">Send</button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-black/20">
                        <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mb-6 animate-pulse">
                            <DiscussionIcon />
                        </div>
                        <p className="text-gray-600 uppercase text-[10px] tracking-[0.5em] font-black">Select Node to Decrypt</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function TeamTab({ project, user, allUsers, onUpdate }) {
    const isLead = project.lead === user.id || user.is_superuser;

    const handleAddMember = async (targetUserId) => {
        if (!targetUserId) return;
        const newMembers = [...(project.members || []), parseInt(targetUserId)];
        try {
            await api.patch(`/projects/${project.id}/`, { members: newMembers });
            onUpdate();
        } catch (err) { alert("Deployment failed."); }
    }

    const handleRemoveMember = async (targetUserId) => {
        const newMembers = project.members.filter(id => id !== targetUserId);
        try {
            await api.patch(`/projects/${project.id}/`, { members: newMembers });
            onUpdate();
        } catch (err) { alert("Operation failed."); }
    }

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-6 tracking-widest flex justify-between items-center">
                    Active Personnel
                    {isLead && (
                        <div className="flex gap-2">
                            <input
                                placeholder="Search users..."
                                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-cyan-500 w-32 transition-all"
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase();
                                    const select = document.getElementById('user-select');
                                    Array.from(select.options).forEach(opt => {
                                        if (opt.value === "") return;
                                        const text = opt.text.toLowerCase();
                                        opt.style.display = text.includes(val) ? 'block' : 'none';
                                    });
                                }}
                            />
                            <select
                                id="user-select"
                                className="bg-white/5 border border-white/10 rounded text-[10px] font-bold uppercase p-1 outline-none hover:border-cyan-500 transition-all w-40"
                                onChange={(e) => handleAddMember(e.target.value)}
                                value=""
                            >
                                <option value="">+ Add Member</option>
                                {allUsers.filter(u => !project.members?.includes(u.id) && u.id !== project.lead).map(u => (
                                    <option key={u.id} value={u.id}>{u.username}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-cyan-500/10 scale-150 rotate-12 transition-transform group-hover:rotate-0"><UserIcon /></div>
                        <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xl relative">
                            {project.lead_details?.username?.[0]}
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111] ${isUserOnline(project.lead_details?.last_login) ? 'bg-green-500' : 'bg-gray-500'}`} />
                        </div>
                        <div>
                            <h4 className="font-bold text-cyan-400">LEAD: {project.lead_details?.profile?.full_name || project.lead_details?.username}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                                {project.lead_details?.profile?.position || "Officer"} •
                                <span className={isUserOnline(project.lead_details?.last_login) ? 'text-green-400' : 'text-gray-500'}>
                                    {isUserOnline(project.lead_details?.last_login) ? 'Available' : 'Away'}
                                </span>
                            </p>
                        </div>
                    </div>
                    {project.members_details?.map(m => (
                        <div key={m.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4 hover:border-white/30 transition-all group overflow-hidden relative">
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold relative">
                                {m.username[0]}
                                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111] ${isUserOnline(m.last_login) ? 'bg-green-500' : 'bg-gray-500'}`} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-200">{m.profile?.full_name || m.username}</h4>
                                <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1">
                                    {m.profile?.position || "Field Agent"} •
                                    <span className={isUserOnline(m.last_login) ? 'text-green-400' : 'text-gray-500'}>
                                        {isUserOnline(m.last_login) ? 'Available' : 'Away'}
                                    </span>
                                </p>
                            </div>
                            {isLead && (
                                <button
                                    onClick={() => handleRemoveMember(m.id)}
                                    className="absolute -right-10 group-hover:right-2 top-1/2 -translate-y-1/2 bg-red-500/20 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all text-xs"
                                >REMOVE</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {isLead && (
                <div className="pt-8 border-t border-white/5">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-6 flex justify-between items-center">
                        Processing Join Requests
                        <span className="bg-cyan-500 text-black px-2 py-0.5 rounded text-[10px]">{project.join_requests?.filter(r => r.status === 'PENDING').length || 0}</span>
                    </h3>
                    <div className="space-y-4">
                        {project.join_requests?.filter(r => r.status === 'PENDING').map(req => (
                            <div key={req.id} className="bg-white/5 border border-white/10 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">{req.user_details?.username?.[0]}</div>
                                    <div>
                                        <h4 className="font-bold text-gray-100">{req.user_details?.profile?.full_name || req.user_details?.username}</h4>
                                        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">{req.user_position || "Member"}</p>
                                        {req.message && <p className="text-xs text-gray-500 mt-1 italic">"{req.message}"</p>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => { await api.post(`/join-requests/${req.id}/approve/`); onUpdate(); }}
                                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase"
                                    >Authorize Access</button>
                                    <button
                                        onClick={async () => { await api.post(`/join-requests/${req.id}/reject/`); onUpdate(); }}
                                        className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all"
                                    >Deny Request</button>
                                </div>
                            </div>
                        ))}
                        {!project.join_requests?.filter(r => r.status === 'PENDING').length && (
                            <p className="text-gray-600 text-xs italic uppercase">No pending recruitment authorization.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function ManagementTab({ project, allUsers, onUpdate }) {
    const [data, setData] = useState({ ...project });
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const handleDelete = async () => {
        if (!window.confirm("CRITICAL WARNING: This will permanently delete the project and all associated data. Are you sure?")) return;
        try {
            await api.delete(`/projects/${project.id}/`);
            navigate("/portal/projects");
        } catch (err) { alert("Deletion failed."); }
    }

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);

        const fd = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'cover_image' && data[key] instanceof File) {
                fd.append('cover_image', data[key]);
            } else if (key !== 'cover_image' && key !== 'lead_details' && key !== 'members_details' && key !== 'tasks' && key !== 'threads' && key !== 'join_requests') {
                // Exclude nested objects read_only
                fd.append(key, data[key]);
            }
        });

        try {
            await api.patch(`/projects/${project.id}/`, fd);
            onUpdate();
            alert("Sector parameters updated successfully.");
        } catch (err) { alert("Failed"); }
        finally { setSaving(false); }
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 max-w-3xl animate-fade-in">
            <h3 className="text-2xl font-bold font-[Orbitron] text-cyan-400 mb-8 border-b border-white/10 pb-4">Sector Command</h3>
            <form onSubmit={handleUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div><label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Operation Status</label>
                        <select className="w-full bg-black/40 border border-white/20 rounded p-3 text-sm focus:border-cyan-400" value={data.status} onChange={e => setData({ ...data, status: e.target.value })}>
                            <option value="PROPOSED">Proposed</option>
                            <option value="IN_PROGRESS">Ongoing Mission</option>
                            <option value="COMPLETED">Mission Accomplished</option>
                            <option value="HALTED">Operation Aborted</option>
                        </select>
                    </div>
                    <div><label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Completion Deadline</label>
                        <input type="date" className="w-full bg-black/40 border border-white/20 rounded p-3 text-sm text-gray-300" value={data.deadline || ""} onChange={e => setData({ ...data, deadline: e.target.value })} />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Project Lead</label>
                    <select className="w-full bg-black/40 border border-white/20 rounded p-3 text-sm text-gray-300" value={data.lead || ""} onChange={e => setData({ ...data, lead: e.target.value })}>
                        <option value="">No Lead Assigned</option>
                        {allUsers?.map(u => <option key={u.id} value={u.id}>{u.username} ({u.profile?.full_name || 'N/A'})</option>)}
                    </select>
                </div>

                <div><label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Classification</label>
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-4 py-2 rounded border border-white/10 hover:border-cyan-500 transition-all">
                            <input type="checkbox" checked={data.is_public === true} onChange={e => setData({ ...data, is_public: e.target.checked })} className="accent-cyan-500" />
                            <span className="text-xs font-bold uppercase">Public Visibility</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-4 py-2 rounded border border-white/10 hover:border-cyan-500 transition-all">
                            <input type="checkbox" checked={data.is_open_source === true} onChange={e => setData({ ...data, is_open_source: e.target.checked })} className="accent-cyan-500" />
                            <span className="text-xs font-bold uppercase">Open Source Repository</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Cover Image (Landing Page)</label>
                    <input type="file" onChange={e => setData({ ...data, cover_image: e.target.files[0] })} className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20" />
                </div>

                <div className="pt-6 flex justify-between items-center">
                    <button type="button" onClick={handleDelete} className="text-red-500 text-xs font-bold uppercase hover:underline">
                        Delete Operation
                    </button>
                    <button disabled={saving} className="bg-cyan-600 hover:bg-cyan-500 text-white px-10 py-3 rounded-lg font-bold uppercase tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">
                        {saving ? 'SYNCHRONIZING...' : 'UPDATE OPERATION DATA'}
                    </button>
                </div>
            </form>
        </div>
    )
}
function RequestAccessButton({ project, user }) {
    const existing = project.join_requests?.find(r => r.user === user.id);
    const [status, setStatus] = useState(existing ? existing.status : null);
    const [msg, setMsg] = useState("");
    const [sending, setSending] = useState(false);

    if (status === 'PENDING') return <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 p-3 rounded font-bold text-sm">REQUEST SENT - AWAITING APPROVAL</div>;
    if (status === 'REJECTED') return <div className="bg-red-500/20 border border-red-500/50 text-red-500 p-3 rounded font-bold text-sm">ACCESS DENIED</div>;
    if (status === 'APPROVED') return <div className="text-green-500">Access Granted! Please refresh.</div>;

    const handleSend = async () => {
        setSending(true);
        try {
            await api.post(`/projects/${project.id}/request_join/`, { message: msg });
            setStatus('PENDING');
        } catch (err) {
            alert(err.response?.data?.error || "Failed");
        } finally { setSending(false); }
    };

    return (
        <div className="space-y-4">
            <textarea
                className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm text-white focus:border-cyan-500"
                placeholder="State your purpose for access..."
                value={msg}
                onChange={e => setMsg(e.target.value)}
            />
            <button disabled={sending} onClick={handleSend} className="bg-cyan-600 hover:bg-cyan-500 text-white w-full py-2 rounded font-bold uppercase transition">
                {sending ? 'Transmitting...' : 'Request Clearance'}
            </button>
        </div>
    );
}
