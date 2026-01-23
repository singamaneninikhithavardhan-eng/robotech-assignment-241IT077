import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { buildMediaUrl } from "../../../utils/mediaUrl";

/* ================= PAGE ================= */

export default function AdminProjectsPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/projects/");
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to load projects", err);
      alert("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/admin/projects/${deleting.id}/`);
      setDeleting(null);
      loadProjects();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete project");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 text-white max-w-6xl mx-auto">

      {/* ===== BACK NAV ===== */}
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="text-sm text-cyan-400 hover:underline mb-4 w-fit"
      >
        ← Back to Dashboard
      </button>

      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400">
            Projects Management
          </h1>
          <p className="text-sm text-gray-400">
            Add, edit and manage all club projects
          </p>
        </div>

        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="bg-cyan-500 px-4 py-2 rounded-lg text-black font-semibold w-full sm:w-auto"
        >
          + Add Project
        </button>
      </div>

      {/* ===== CONTENT ===== */}
      {loading ? (
        <div className="text-gray-400">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="text-gray-400">No projects yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className="glass rounded-xl overflow-hidden"
            >
              {p.image_path ? (
                <img
                  src={buildMediaUrl(p.image_path)}
                  alt={p.title}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="h-40 w-full bg-white/10 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}

              <div className="p-4">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-xs text-gray-400">
                  Lead: {p.project_lead}
                </p>

                <div className="flex gap-4 mt-3">
                  <button
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                    className="text-cyan-400 text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleting(p)}
                    className="text-red-400 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== MODALS ===== */}
      {formOpen && (
        <ProjectForm
          editing={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            loadProjects();
          }}
        />
      )}

      {deleting && (
        <DeleteModal
          title={deleting.title}
          loading={deleteLoading}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

/* ================= FORM ================= */

function ProjectForm({ editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: editing?.title || "",
    project_lead: editing?.project_lead || "",
    description: editing?.description || "",
    is_open_source: editing?.is_open_source || false,
    github_url: editing?.github_url || "",
  });

  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) {
      setForm({
        title: "",
        project_lead: "",
        description: "",
        is_open_source: false,
        github_url: "",
      });
      setImages([]);
      setError("");
    }
  }, [editing]);

  const submit = async () => {
    if (!form.title || !form.project_lead) {
      setError("Title and project lead are required.");
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));

    // Django expects 'cover_image' (single file)
    if (images.length > 0) {
      fd.append("cover_image", images[0]);
    }

    try {
      setSaving(true);

      if (editing) {
        await api.put(`/admin/projects/${editing.id}/`, fd);
      } else {
        await api.post("/admin/projects/", fd);
      }

      onSaved();
    } catch (err) {
      console.error("Save failed", err);
      setError("Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass p-6 w-full max-w-lg space-y-4">
        <h3 className="text-xl text-cyan-400 font-semibold">
          {editing ? "Edit Project" : "Add Project"}
        </h3>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <input
          placeholder="Project Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full input"
        />

        <input
          placeholder="Project Lead"
          value={form.project_lead}
          onChange={(e) =>
            setForm({ ...form, project_lead: e.target.value })
          }
          className="w-full input"
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          className="w-full input"
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_open_source}
            onChange={(e) =>
              setForm({ ...form, is_open_source: e.target.checked })
            }
          />
          Open Source
        </label>

        {form.is_open_source && (
          <input
            placeholder="GitHub URL"
            value={form.github_url}
            onChange={(e) =>
              setForm({ ...form, github_url: e.target.value })
            }
            className="w-full input"
          />
        )}

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            const files = [...e.target.files];
            const tooLarge = files.find(
              (f) => f.size > 800 * 1024
            );

            if (tooLarge) {
              setError("Each image must be under 800 KB");
              e.target.value = "";
              return;
            }

            setImages(files);
          }}
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 bg-cyan-500 text-black rounded"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= DELETE MODAL ================= */

function DeleteModal({ title, loading, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass w-full max-w-sm p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-red-400 mb-3">
          Confirm Delete
        </h3>

        <p className="text-sm text-gray-300 mb-6">
          Are you sure you want to delete <b>{title}</b>?<br />
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded bg-gray-700"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded bg-red-600 text-white"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
