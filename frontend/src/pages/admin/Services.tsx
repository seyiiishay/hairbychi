import { useEffect, useState } from "react";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
  type AdminService,
} from "../../api/endpoints";
import type { Category } from "../../api/types";
import { fetchAllPages } from "../../lib/pagination";
import { money } from "../../lib/timezone";
import { ApiRequestError } from "../../api/client";
import { errorMessage } from "../../lib/errors";
import { Card, ErrorBanner, PrimaryButton, SecondaryButton, Spinner } from "../../components/Shared";

export default function Services() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [services, setServices] = useState<AdminService[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newService, setNewService] = useState({ category: "", name: "", price: "", duration_minutes: "" });

  const load = () => {
    fetchAllPages<Category>("/admin/categories")
      .then(setCategories)
      .catch(() => setError("Couldn't load categories."));
    fetchAllPages<AdminService>("/admin/services")
      .then(setServices)
      .catch(() => setError("Couldn't load services."));
  };

  useEffect(load, [reload]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await adminCreateCategory({ name: newCategoryName.trim(), display_order: (categories?.length || 0) + 1 });
      setNewCategoryName("");
      setReload((r) => r + 1);
    } catch (err) {
      setError(err instanceof ApiRequestError ? errorMessage(err.code, err.message) : "Couldn't add category.");
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.category || !newService.name || !newService.price || !newService.duration_minutes) return;
    try {
      await adminCreateService({
        category: newService.category,
        name: newService.name,
        description: "",
        photo_url: "",
        price: newService.price,
        duration_minutes: parseInt(newService.duration_minutes, 10),
        display_order: 0,
        is_active: true,
      });
      setNewService({ category: "", name: "", price: "", duration_minutes: "" });
      setReload((r) => r + 1);
    } catch (err) {
      setError(err instanceof ApiRequestError ? errorMessage(err.code, err.message) : "Couldn't add service.");
    }
  };

  const toggleServiceActive = async (service: AdminService) => {
    await adminUpdateService(service.id, { is_active: !service.is_active });
    setReload((r) => r + 1);
  };

  const removeService = async (id: string) => {
    if (!window.confirm("Delete this service? Existing bookings keep their historical snapshot.")) return;
    await adminDeleteService(id);
    setReload((r) => r + 1);
  };

  const removeCategory = async (id: string) => {
    if (!window.confirm("Delete this category and all its services?")) return;
    await adminDeleteCategory(id);
    setReload((r) => r + 1);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-stone-900">Services & Categories</h1>
      <ErrorBanner message={error} />

      <Card className="space-y-3">
        <h2 className="font-medium text-stone-900">Add a category</h2>
        <form onSubmit={handleAddCategory} className="flex gap-3">
          <input
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
            placeholder="e.g. Braids"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <SecondaryButton type="submit">Add</SecondaryButton>
        </form>
      </Card>

      {!categories || !services ? (
        <Spinner />
      ) : (
        categories.map((cat) => (
          <Card key={cat.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-stone-900">{cat.name}</h2>
              <button className="text-xs text-red-600 hover:underline" onClick={() => removeCategory(cat.id)}>
                Delete category
              </button>
            </div>
            <div className="space-y-2">
              {services
                .filter((s) => s.category === cat.id)
                .map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm">
                    <div>
                      <span className={s.is_active ? "" : "text-stone-400 line-through"}>{s.name}</span>
                      <span className="ml-2 text-stone-500">
                        {money(s.price)} · {s.duration_minutes} min
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button className="text-stone-500 hover:underline" onClick={() => toggleServiceActive(s)}>
                        {s.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button className="text-red-600 hover:underline" onClick={() => removeService(s.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              {services.filter((s) => s.category === cat.id).length === 0 && (
                <p className="text-sm text-stone-400">No services yet.</p>
              )}
            </div>
          </Card>
        ))
      )}

      <Card className="space-y-3">
        <h2 className="font-medium text-stone-900">Add a service</h2>
        <p className="text-xs text-stone-400">No deposit fields here — deposits are computed per-booking automatically.</p>
        <form onSubmit={handleAddService} className="grid gap-3 sm:grid-cols-2">
          <select
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={newService.category}
            onChange={(e) => setNewService({ ...newService, category: e.target.value })}
          >
            <option value="">Select category…</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
            placeholder="Service name"
            value={newService.name}
            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
          />
          <input
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
            placeholder="Price (CAD)"
            type="number"
            step="0.01"
            value={newService.price}
            onChange={(e) => setNewService({ ...newService, price: e.target.value })}
          />
          <input
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
            placeholder="Duration (minutes)"
            type="number"
            value={newService.duration_minutes}
            onChange={(e) => setNewService({ ...newService, duration_minutes: e.target.value })}
          />
          <PrimaryButton type="submit" className="sm:col-span-2">
            Add service
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
