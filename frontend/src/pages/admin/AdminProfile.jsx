import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../api/axios";

export default function AdminProfile() {
    const { user, setUser } = useOutletContext();

    const [form, setForm] = useState({
        full_name: "",
        roll_number: "",
        department: "",
        year: "",
        year_of_joining: "",
        sig: "",
        github_url: "",
        linkedin_url: "",
        instagram_url: "",
        email: "",
        description: "",
        is_public: true // Default
    });

    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (user && user.profile) {
            setForm({
                full_name: user.profile.full_name || "",
                roll_number: user.profile.roll_number || "",
                department: user.profile.department || "",
                year: user.profile.year || "",
                year_of_joining: user.profile.year_of_joining || "",
                sig: user.profile.sig || "",
                github_url: user.profile.github_url || "",
                linkedin_url: user.profile.linkedin_url || "",
                instagram_url: user.profile.instagram_url || "",
                email: user.profile.email || user.email || "",
                description: user.profile.description || "",
                is_public: user.profile.is_public !== false // default true if undefined
            });
            setPreview(user.profile.image);
        }
    }, [user]);

    const handleChange = (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({ ...form, [e.target.name]: val });
    };

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess("");

        const fd = new FormData();
        Object.keys(form).forEach(key => {
            fd.append(key, form[key]);
        });
        if (image) {
            fd.append("image", image);
        }

        try {
            const res = await api.patch("/me/", fd);
            setUser(res.data);
            setSuccess("Profile updated successfully!");
            // Scroll to top
            window.scrollTo(0, 0);
        } catch (err) {
            console.error(err);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-10">
            <h1 className="text-3xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-8">
                My Profile
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* LEFT: IMAGE CARD & VISIBILITY */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                        <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-cyan-500/20 mb-4 group">
                            {preview ? (
                                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-cyan-900/30 flex items-center justify-center text-4xl font-bold text-cyan-500">
                                    {user?.username?.[0]}
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                <span className="text-sm font-semibold text-white">Change Photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImage} />
                            </label>
                        </div>

                        <h2 className="text-xl font-bold text-white">{user?.username}</h2>
                        <p className="text-cyan-400 text-sm mb-4">{user?.role}</p>
                    </div>

                    {/* VISIBILITY CARD */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Privacy Settings</h3>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm text-gray-300">Show on Public Website</span>
                            <input
                                type="checkbox"
                                name="is_public"
                                checked={form.is_public}
                                onChange={handleChange}
                                className="accent-cyan-500 w-5 h-5 cursor-pointer"
                            />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                            Uncheck this to hide your profile from the Team page while keeping your account active.
                        </p>
                    </div>
                </div>

                {/* RIGHT: FORM */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                        {success && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2">
                                <span>✓</span> {success}
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-cyan-400 border-b border-white/5 pb-2">Personal Information</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                                    <input name="full_name" value={form.full_name} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-cyan-400 outline-none text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Roll Number</label>
                                    <input name="roll_number" value={form.roll_number} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-cyan-400 outline-none text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Email ID</label>
                                    <input name="email" value={form.email} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-cyan-400 outline-none text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-purple-400 border-b border-white/5 pb-2">Academic & Team</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Department</label>
                                    <input name="department" value={form.department} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-purple-400 outline-none text-white" placeholder="e.g. CSE" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Year of Joining</label>
                                    <input name="year_of_joining" type="number" value={form.year_of_joining} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-purple-400 outline-none text-white" placeholder="2023" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Current Year / Batch</label>
                                    <input name="year" value={form.year} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-purple-400 outline-none text-white" placeholder="e.g. 2nd Year" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">SIG (Special Interest Group)</label>
                                    <input name="sig" value={form.sig} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-purple-400 outline-none text-white" placeholder="e.g. Systems" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-pink-400 border-b border-white/5 pb-2">Socials & Bio</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">GitHub URL</label>
                                    <input name="github_url" value={form.github_url} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-pink-400 outline-none text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">LinkedIn URL</label>
                                    <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-pink-400 outline-none text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Instagram URL</label>
                                    <input name="instagram_url" value={form.instagram_url} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-pink-400 outline-none text-white" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Bio / Description</label>
                                <textarea rows="3" name="description" value={form.description} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-pink-400 outline-none text-white" placeholder="Short bio..." />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold text-white hover:opacity-90 transition shadow-lg shadow-cyan-500/20">
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
