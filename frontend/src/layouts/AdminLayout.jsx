import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Initial Auth Check & User Load
        const token = localStorage.getItem("accessToken");
        if (!token) {
            navigate("/login");
            return;
        }

        // We fetch /me/ to get full profile & permissions
        api.get("/me/")
            .then(res => {
                setUser(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Auth failed", err);
                // Force logout on error
                localStorage.removeItem("accessToken");
                navigate("/login");
                setLoading(false); // Stop loading so we don't hang
            });
    }, [navigate]);

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#05060a] flex items-center justify-center text-cyan-500 font-bold tracking-widest animate-pulse">
                LOADING ADMIN PANEL...
            </div>
        );
    }

    // Ensure user object exists to prevent crashes in Sidebar/Outlet
    const safeUser = user || { username: "Guest", role: "GUEST" };

    return (
        <div className="flex min-h-screen bg-[#05060a] text-white font-sans">
            <AdminSidebar user={safeUser} logout={logout} />

            <main className="flex-1 overflow-x-hidden h-screen overflow-y-auto relative custom-scrollbar">
                {/* Top ambient glow */}
                <div className="absolute top-0 left-0 w-full h-96 bg-cyan-900/10 blur-[100px] pointer-events-none" />

                <div className="p-6 md:p-10 max-w-7xl mx-auto relative z-10">
                    {/* Pass user and setUser to all child routes */}
                    <Outlet context={{ user: safeUser, setUser }} />
                </div>
            </main>
        </div>
    );
}
