import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { countries } from "../../utils/countries";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

/* ─── Inline SVG icons ─── */
const IcUpload  = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>;
const IcEdit    = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcTrash   = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
const IcBack    = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>;

/* ─── Shared input style ─── */
const iS = {
  width: "100%",
  padding: "0.6rem 1rem",
  borderRadius: "8px",
  border: "1px solid #3f3f46",
  background: "#111113",
  color: "#fff",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const BannerManagement = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    country: "ALL",
    position: 0,
    file: null,
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/slides");
      setBanners(res.data?.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const flash = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((p) => ({ ...p, file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !formData.file) { flash("Image is required.", "error"); return; }
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", formData.title);
      form.append("description", formData.description);
      form.append("link", formData.link);
      form.append("country", formData.country);
      form.append("position", formData.position);
      if (formData.file) form.append("image", formData.file);

      if (editingId) {
        await apiClient.put(`/slides/${editingId}`, form);
        flash("Banner updated.");
      } else {
        await apiClient.post("/slides", form);
        flash("Banner created.");
      }
      resetForm();
      fetchBanners();
    } catch (err) {
      flash(err.response?.data?.message || "Failed to save banner.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingId(banner._id);
    setFormData({
      title: banner.title,
      description: banner.description || "",
      link: banner.link || "",
      country: banner.country,
      position: banner.position,
      file: null,
    });
    setPreviewUrl(banner.image?.url || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await apiClient.delete(`/slides/${id}`);
      flash("Banner deleted.");
      fetchBanners();
    } catch {
      flash("Failed to delete.", "error");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setPreviewUrl(null);
    setFormData({ title: "", description: "", link: "", country: "ALL", position: 0, file: null });
  };

  const set = (field) => (e) =>
    setFormData((p) => ({ ...p, [field]: e.target.value }));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse 80% 40% at 50% -5%, rgba(168,85,247,0.1) 0%, transparent 60%), #09090b",
        fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
        color: "#fff",
      }}
    >
      {/* Header */}
      <header
        style={{
          height: "60px",
          borderBottom: "1px solid #1c1c1f",
          background: "rgba(9,9,11,0.9)",
          backdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>✦</div>
          <span style={{ fontWeight: 700, color: "#fff" }}>Banner Management</span>
        </div>
        <button
          onClick={() => navigate("/admin/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.85rem", borderRadius: "8px", border: "1px solid #3f3f46", background: "transparent", color: "#a1a1aa", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}
        >
          <IcBack /> Dashboard
        </button>
      </header>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Flash message */}
        {msg.text && (
          <div style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            background: msg.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
            border: `1px solid ${msg.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
            color: msg.type === "error" ? "#fca5a5" : "#86efac",
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
          }}>
            {msg.text}
          </div>
        )}

        {/* Form Card */}
        <div
          style={{
            background: "rgba(24,24,27,0.7)",
            border: "1px solid #27272a",
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
            {editingId ? "✏️ Edit Banner" : "➕ Create Banner"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={lbl}>Title *</label>
                <input type="text" value={formData.title} onChange={set("title")} required placeholder="e.g. Summer Sale" style={iS} />
              </div>
              <div>
                <label style={lbl}>Country</label>
                <select value={formData.country} onChange={set("country")} style={iS}>
                  <option value="ALL">All Countries</option>
                  {countries.map((c) => (
                    <option key={c.value} value={c.isoCode}>{c.label} ({c.isoCode})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={lbl}>Description</label>
              <textarea value={formData.description} onChange={set("description")} rows={3} placeholder="Optional description" style={iS} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={lbl}>Link (optional)</label>
                <input type="url" value={formData.link} onChange={set("link")} placeholder="https://..." style={iS} />
              </div>
              <div>
                <label style={lbl}>Position</label>
                <input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData((p) => ({ ...p, position: parseInt(e.target.value) || 0 }))}
                  style={iS}
                />
              </div>
            </div>

            {/* File + preview */}
            <div style={{ display: "grid", gridTemplateColumns: previewUrl ? "1fr auto" : "1fr", gap: "1rem", marginBottom: "1.5rem", alignItems: "start" }}>
              <div>
                <label style={lbl}>{editingId ? "Replace Image (optional)" : "Banner Image *"}</label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px dashed #3f3f46",
                    cursor: "pointer",
                    background: "rgba(9,9,11,0.5)",
                    color: "#71717a",
                    fontSize: "0.875rem",
                    transition: "border-color 0.2s",
                  }}
                >
                  <IcUpload />
                  {formData.file ? formData.file.name : "Click to choose image"}
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
              </div>
              {previewUrl && (
                <img src={previewUrl} alt="Preview" style={{ width: "100px", height: "70px", objectFit: "cover", borderRadius: "8px", border: "1px solid #3f3f46" }} />
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="submit"
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.25rem", borderRadius: "8px", border: "none", background: "#7c3aed", color: "#fff", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}
              >
                <IcUpload />
                {saving ? "Saving…" : editingId ? "Update Banner" : "Create Banner"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", border: "1px solid #3f3f46", background: "transparent", color: "#a1a1aa", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Banners list */}
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
          All Banners ({banners.length})
        </h3>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-shimmer" style={{ height: "80px", borderRadius: "12px" }} />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", border: "1px dashed #3f3f46", borderRadius: "12px", color: "#52525b" }}>
            No banners yet. Create one above.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {banners.map((banner) => (
              <div
                key={banner._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 1.25rem",
                  borderRadius: "12px",
                  border: "1px solid #27272a",
                  background: "rgba(24,24,27,0.6)",
                }}
              >
                {banner.image && (
                  <img
                    src={banner.image.url}
                    alt={banner.title}
                    style={{ width: "80px", height: "56px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "#fff", fontSize: "0.9rem" }}>{banner.title}</p>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#71717a" }}>
                    Country: {banner.country} · Position: {banner.position} · {banner.isActive ? <FaCheckCircle color="#22c55e" style={{display:"inline"}} /> : <FaTimesCircle color="#ef4444" style={{display:"inline"}} />} {banner.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button onClick={() => handleEdit(banner)} style={iconBtn("#3b82f6")}>
                    <IcEdit />
                  </button>
                  <button onClick={() => handleDelete(banner._id)} style={iconBtn("#ef4444")}>
                    <IcTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const lbl = { display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#a1a1aa", marginBottom: "0.4rem" };
const iconBtn = (color) => ({
  width: "34px",
  height: "34px",
  borderRadius: "8px",
  border: `1px solid ${color}33`,
  background: `${color}15`,
  color,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "background 0.2s",
  flexShrink: 0,
});

export default BannerManagement;
