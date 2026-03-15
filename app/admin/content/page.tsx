// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AuthGuard } from "@/components/somago/auth-guard";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminContentPage() {
  return (
    <AuthGuard message="Please sign in to manage site content." requiredRole="admin">
      <AdminContentContent />
    </AuthGuard>
  );
}

function AdminContentContent() {
  const allContent = useQuery(api.siteContent.getAll);
  const upsertContent = useMutation(api.siteContent.upsert);
  const toggleActive = useMutation(api.siteContent.toggleActive);

  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    key: "",
    type: "banner" as "banner" | "announcement" | "section",
    title: "",
    body: "",
    imageUrl: "",
    linkUrl: "",
    isActive: true,
    order: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  const openEditForm = (item: any) => {
    setForm({
      key: item.key,
      type: item.type,
      title: item.title ?? "",
      body: item.body ?? "",
      imageUrl: item.imageUrl ?? "",
      linkUrl: item.linkUrl ?? "",
      isActive: item.isActive,
      order: item.order,
    });
    setEditingKey(item.key);
    setShowForm(true);
  };

  const openNewForm = () => {
    setForm({
      key: "",
      type: "banner",
      title: "",
      body: "",
      imageUrl: "",
      linkUrl: "",
      isActive: true,
      order: 0,
    });
    setEditingKey(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.key.trim()) {
      toast.error("Key is required");
      return;
    }
    setIsSaving(true);
    try {
      await upsertContent({
        key: form.key.trim(),
        type: form.type,
        title: form.title || undefined,
        body: form.body || undefined,
        imageUrl: form.imageUrl || undefined,
        linkUrl: form.linkUrl || undefined,
        isActive: form.isActive,
        order: form.order,
      });
      toast.success(editingKey ? "Content updated!" : "Content created!");
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (allContent === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  const banners = allContent.filter((c) => c.type === "banner");
  const announcements = allContent.filter((c) => c.type === "announcement");
  const sections = allContent.filter((c) => c.type === "section");

  const ContentGroup = ({ title, items }: { title: string; items: any[] }) => (
    <div className="rounded-lg border border-border bg-white">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-neutral-500">No {title.toLowerCase()} yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div key={item._id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {item.title || item.key}
                  </p>
                  <Badge className={item.isActive ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-600"}>
                    {item.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-neutral-400">Order: {item.order}</span>
                </div>
                {item.body && (
                  <p className="mt-0.5 text-xs text-neutral-500 truncate">{item.body}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActive({ id: item._id })}
                >
                  {item.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditForm(item)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Site Content (CMS)</h1>
          <p className="text-sm text-neutral-500">Manage banners, announcements, and content sections</p>
        </div>
        <Button className="bg-primary-600 hover:bg-primary-700" onClick={openNewForm}>
          + Add Content
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">
            {editingKey ? "Edit Content" : "New Content"}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Key (unique ID)</label>
              <Input
                placeholder="e.g. hero-banner-1"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                disabled={!!editingKey}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="banner">Banner</option>
                <option value="announcement">Announcement</option>
                <option value="section">Section</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">Title</label>
            <Input
              placeholder="Content title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">Body</label>
            <Textarea
              placeholder="Content body text"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Image URL</label>
              <Input
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Link URL</label>
              <Input
                placeholder="https://..."
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Order</label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-neutral-300"
                />
                <span className="text-sm text-neutral-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="bg-primary-600 hover:bg-primary-700"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : editingKey ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <ContentGroup title="Banners" items={banners} />
      <ContentGroup title="Announcements" items={announcements} />
      <ContentGroup title="Sections" items={sections} />
    </div>
  );
}
