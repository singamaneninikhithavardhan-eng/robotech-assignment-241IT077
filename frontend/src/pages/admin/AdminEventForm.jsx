import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import { buildMediaUrl } from "../../../utils/mediaUrl";

/* ===== BANNER VALIDATION ===== */
const MAX_BANNER_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
];

export default function AdminEventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: "",
    short_description: "",
    full_description: "",
    venue: "",
    visibility: "DRAFT",
    display_order: 0,
    registration_enabled: false,
    registration_start: "",
    registration_end: "",
    external_registration_link: "",
    external_links: [],
    event_date: dateParam || "",
    due_date: "",
    scope: "GLOBAL",
    sig: "",
    is_full_event: true
  });

  const [sigs, setSigs] = useState([]);

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [status, setStatus] = useState("idle");

  /* ===== TOAST ===== */
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info" // info | success | error
  });

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "info" }),
      3000
    );
  };

  /* ================= LOAD EVENT (EDIT) ================= */
  useEffect(() => {
    loadSigs();
    if (isEdit) loadEvent();
  }, [id]);

  async function loadSigs() {
    try {
      const res = await api.get("/sigs/");
      setSigs(res.data.results || res.data || []);
    } catch (e) {
      console.error("Failed to load SIGs", e);
    }
  }

  async function loadEvent() {
    const res = await api.get(`/events/${id}/`);

    setForm({
      title: res.data.title ?? "",
      short_description: res.data.short_description ?? "",
      full_description: res.data.full_description ?? "",
      venue: res.data.venue ?? "",
      visibility: res.data.visibility ?? "DRAFT",
      display_order: res.data.display_order ?? 0,
      registration_enabled: !!res.data.registration_enabled,
      registration_start: res.data.registration_start
        ? res.data.registration_start.slice(0, 16)
        : "",
      registration_end: res.data.registration_end
        ? res.data.registration_end.slice(0, 16)
        : "",
      external_registration_link:
        res.data.external_registration_link ?? "",
      external_links: Array.isArray(res.data.external_links)
        ? res.data.external_links
        : [],
      event_date: res.data.event_date ? res.data.event_date.slice(0, 16) : "",
      due_date: res.data.due_date ? res.data.due_date.slice(0, 16) : "",
      scope: res.data.scope ?? "GLOBAL",
      sig: res.data.sig ?? "",
      is_full_event: res.data.is_full_event ?? true
    });

    if (res.data.banner_image) {
      setBannerPreview(
        buildMediaUrl(`/media/events/${res.data.banner_image}`)
      );
    }
  }

  /* ================= FORM HELPERS ================= */
  function updateField(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function validateForm() {
    const isFull = form.is_full_event;

    // Basic fields always required
    if (!form.title || !form.short_description) {
      showToast("Please fill title and short description.", "error");
      return false;
    }

    // Full event specific requirements
    if (isFull) {
      if (!form.full_description) {
        showToast("Full description is required for full events.", "error");
        return false;
      }
      if (!isEdit && !bannerFile) {
        showToast("Banner image is required for new full events.", "error");
        return false;
      }
    }

    if (
      form.registration_enabled &&
      (!form.registration_start ||
        !form.registration_end ||
        !form.external_registration_link)
    ) {
      showToast("Registration fields are incomplete.", "error");
      return false;
    }

    return true;
  }

  function addExternalLink() {
    setForm(prev => ({
      ...prev,
      external_links: [...prev.external_links, { label: "", url: "" }]
    }));
  }

  function updateExternalLink(i, field, value) {
    const links = [...form.external_links];
    links[i] = { ...links[i], [field]: value };
    setForm(prev => ({ ...prev, external_links: links }));
  }

  function removeExternalLink(i) {
    setForm(prev => ({
      ...prev,
      external_links: prev.external_links.filter((_, idx) => idx !== i)
    }));
  }

  /* ================= SUBMIT ================= */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setStatus("saving");

      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        fd.append(
          key,
          key === "external_links" ? JSON.stringify(value) : value
        );
      });

      if (bannerFile) {
        fd.append("banner", bannerFile);
      }

      if (isEdit) {
        await api.put(`/events/${id}/`, fd);
      } else {
        await api.post("/events/", fd);
      }

      showToast("Event saved successfully.", "success");
      navigate("/portal/events");
    } catch (err) {
      console.error(err);
      showToast("Failed to save event.", "error");
      setStatus("idle");
    }
  }

  /* ================= UI ================= */
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto text-white">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6">
        {isEdit ? "Edit Event" : "Create Event"}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6"
      >
        {/* ===== BASIC INFO ===== */}
        <section className="space-y-4">
          <input
            name="title"
            placeholder="Event title"
            value={form.title}
            onChange={updateField}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
            required
          />

          <textarea
            name="short_description"
            placeholder="Short description (for calendar/previews)"
            value={form.short_description}
            onChange={updateField}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 h-24"
            required
          />

          {form.is_full_event && (
            <textarea
              name="full_description"
              placeholder="Full description (HTML allowed)"
              value={form.full_description}
              onChange={updateField}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 h-44"
            />
          )}

          <input
            name="venue"
            placeholder="Venue"
            value={form.venue}
            onChange={updateField}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
          />
        </section>

        {/* ===== SCHEDULE ===== */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Event Date/Time
            </label>
            <input
              type="datetime-local"
              name="event_date"
              value={form.event_date}
              onChange={updateField}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Due Date / Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              name="due_date"
              value={form.due_date}
              onChange={updateField}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
            />
          </div>
        </section>

        {/* ===== SCOPE & TYPE ===== */}
        <section className="space-y-4 border-t border-white/5 pt-4">
          <h3 className="text-lg font-semibold text-cyan-300">Classification</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Scope</label>
              <select
                name="scope"
                value={form.scope}
                onChange={updateField}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 outline-none focus:border-cyan-500/50"
              >
                <option value="GLOBAL">Global (Whole Club)</option>
                <option value="SIG">SIG Specific</option>
                <option value="PERSONAL">Personal</option>
              </select>
            </div>

            {form.scope === 'SIG' && (
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Associated SIG</label>
                <select
                  name="sig"
                  value={form.sig}
                  onChange={updateField}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 outline-none focus:border-cyan-500/50"
                >
                  <option value="">-- Select SIG --</option>
                  {sigs.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-black/20 cursor-pointer hover:border-white/30 transition">
                <input
                  type="checkbox"
                  name="is_full_event"
                  checked={form.is_full_event}
                  onChange={updateField}
                  className="w-5 h-5 accent-cyan-500"
                />
                <div>
                  <span className="block font-medium text-white">Full Event Page</span>
                  <span className="block text-xs text-gray-400">If unchecked, this will be a calendar-only entry with no dedicated page.</span>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* ===== APPEARANCE CONTROL ===== */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Visibility
            </label>
            <select
              name="visibility"
              value={form.visibility}
              onChange={updateField}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
            >
              <option value="DRAFT">Draft (Hidden)</option>
              <option value="PUBLISHED">Published (Public)</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Display Order (Higher = Higher Priority)
            </label>
            <input
              type="number"
              name="display_order"
              value={form.display_order}
              onChange={updateField}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
            />
          </div>
        </section>

        {/* ===== BANNER (STRICT VALIDATION ONLY ADDITION) ===== */}
        {/* ===== BANNER (STRICT VALIDATION ONLY ADDITION) ===== */}
        {form.is_full_event && (
          <section className="space-y-2">
            <label className="text-sm text-gray-400">
              Event Banner {isEdit ? "(optional)" : "(required)"} — Max 2 MB
            </label>

            {bannerPreview && (
              <img
                src={bannerPreview}
                alt="Banner preview"
                className="h-40 w-full object-cover rounded-lg border border-white/10"
              />
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={e => {
                const file = e.target.files[0];
                if (!file) return;

                if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                  showToast(
                    "Invalid image format. Allowed: PNG, JPG, JPEG, WEBP.",
                    "error"
                  );
                  e.target.value = "";
                  return;
                }

                if (file.size > MAX_BANNER_SIZE) {
                  showToast(
                    "Banner image exceeds the maximum size of 2 MB.",
                    "error"
                  );
                  e.target.value = "";
                  return;
                }

                setBannerFile(file);
                setBannerPreview(URL.createObjectURL(file));
              }}
              className="block text-sm"
            />
          </section>
        )}

        {/* ===== REGISTRATION ===== */}
        <section>
          <label className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              name="registration_enabled"
              checked={form.registration_enabled}
              onChange={updateField}
            />
            Enable registration
          </label>

          {form.registration_enabled && (
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="datetime-local"
                name="registration_start"
                value={form.registration_start}
                onChange={updateField}
                className="bg-black/40 border border-white/10 rounded-lg p-3"
              />
              <input
                type="datetime-local"
                name="registration_end"
                value={form.registration_end}
                onChange={updateField}
                className="bg-black/40 border border-white/10 rounded-lg p-3"
              />
              <input
                name="external_registration_link"
                placeholder="External registration link"
                value={form.external_registration_link}
                onChange={updateField}
                className="sm:col-span-2 bg-black/40 border border-white/10 rounded-lg p-3"
              />
            </div>
          )}
        </section>

        {/* ===== EXTERNAL LINKS ===== */}
        <section>
          <h2 className="text-lg font-semibold text-cyan-300 mb-3">
            External Links
          </h2>

          {form.external_links.map((l, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                placeholder="Label"
                value={l.label}
                onChange={e =>
                  updateExternalLink(i, "label", e.target.value)
                }
                className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2"
              />
              <input
                placeholder="https://..."
                value={l.url}
                onChange={e =>
                  updateExternalLink(i, "url", e.target.value)
                }
                className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2"
              />
              <button
                type="button"
                onClick={() => removeExternalLink(i)}
                className="text-red-400 px-2"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addExternalLink}
            className="text-cyan-400 text-sm"
          >
            + Add external link
          </button>
        </section>

        {/* ===== SUBMIT ===== */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={status === "saving"}
            className="px-6 py-3 rounded-lg font-semibold bg-cyan-500 hover:bg-cyan-600 text-black"
          >
            {status === "saving"
              ? "Saving event…"
              : isEdit
                ? "Save Changes"
                : "Create Event"}
          </button>
        </div>
      </form>

      {/* ===== TOAST ===== */}
      {toast.show && (
        <div
          className={`
            fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm
            ${toast.type === "success"
              ? "bg-green-600"
              : toast.type === "error"
                ? "bg-red-600"
                : "bg-cyan-600"
            }
          `}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
