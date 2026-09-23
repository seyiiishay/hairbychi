import { useRef, useState, type FormEvent } from "react";
import { subDays } from "date-fns";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { CATEGORIES } from "../../data/catalog";
import type { CategoryId, Discount, GalleryItem, GalleryLabel, Service, Stylist } from "../../data/types";
import { cn, dateKey, duration, money, uid } from "../../lib/format";
import { useStore } from "../../store/store";
import { addBlock, deleteDiscount, removeGalleryItem, saveDiscount, saveGalleryItem, saveService, saveStylist } from "../../store/studio";
import { Stars } from "../../ui/bits";
import { readImage } from "../../ui/form";
import Modal from "../../ui/Modal";
import Photo from "../../ui/Photo";
import { Panel, SmallField, StudioTitle, inputCls } from "./StudioLayout";

const btn = "inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-ivory";
const btn2 = "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-semibold hover:border-ink";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-sm">
      <span className={cn("relative h-6 w-10 rounded-full transition", checked ? "bg-success" : "bg-sand-deep")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition", checked ? "left-4.5" : "left-0.5")} />
      </span>
      {label}: <strong>{checked ? "Yes" : "No"}</strong>
    </button>
  );
}

// ------------------------------- Services -------------------------------

const blankService = (): Service => ({
  id: "",
  name: "",
  categoryId: "braids",
  tagline: "",
  description: "",
  price: 100,
  priceFrom: true,
  minutes: 120,
  deposit: 30,
  hairIncluded: false,
  suitableFor: "All hair types",
  includes: [],
  prep: "Please arrive with your hair washed and detangled.",
  addOnIds: [],
  stylistIds: [],
  goals: [],
  consultation: false,
  popular: false,
  active: true,
  art: "braids",
  tone: "sand",
});

export function ServicesAdmin() {
  const s = useStore();
  const [edit, setEdit] = useState<Service | null>(null);
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const list = s.services.filter((x) => cat === "all" || x.categoryId === cat);
  return (
    <>
      <StudioTitle
        title="Services"
        sub={`${s.services.filter((x) => x.active).length} active of ${s.services.length}`}
        actions={
          <button className={btn} onClick={() => setEdit(blankService())}>
            <Plus className="size-4" aria-hidden /> New service
          </button>
        }
      />
      <select value={cat} onChange={(e) => setCat(e.target.value as CategoryId)} className={cn(inputCls, "mb-4 w-auto")} aria-label="Category">
        <option value="all">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line/70">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Service</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 text-right font-semibold">Price</th>
              <th className="px-4 py-3 text-right font-semibold">Deposit</th>
              <th className="px-4 py-3 font-semibold">Duration</th>
              <th className="px-4 py-3 font-semibold">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((x) => (
              <tr key={x.id} className={cn(!x.active && "text-muted")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Photo art={x.art} tone={x.tone} path={`services/${x.id}`} src={x.image} alt="" className="size-10 shrink-0 rounded-lg" />
                    <span className="font-semibold">{x.name}</span>
                    {x.consultation ? <span className="rounded-full bg-gold-soft px-2 text-[0.65rem] font-semibold">Consult</span> : null}
                  </div>
                </td>
                <td className="px-4 py-3">{CATEGORIES.find((c) => c.id === x.categoryId)?.name}</td>
                <td className="px-4 py-3 text-right">
                  {x.priceFrom ? "from " : ""}
                  {money(x.price)}
                </td>
                <td className="px-4 py-3 text-right">{money(x.deposit)}</td>
                <td className="px-4 py-3">{duration(x.minutes)}</td>
                <td className="px-4 py-3">{x.active ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <button className={btn2} onClick={() => setEdit(x)}>
                    <Pencil className="size-3.5" aria-hidden /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit ? <ServiceEditor svc={edit} onClose={() => setEdit(null)} /> : null}
    </>
  );
}

function ServiceEditor({ svc, onClose }: { svc: Service; onClose: () => void }) {
  const s = useStore();
  const [f, setF] = useState<Service>(svc);
  const [includes, setIncludes] = useState(svc.includes.join("\n"));
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !svc.id;
  const set = <K extends keyof Service>(k: K, v: Service[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (k: "addOnIds" | "stylistIds", id: string) => set(k, f[k].includes(id) ? f[k].filter((x) => x !== id) : [...f[k], id]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const cat = CATEGORIES.find((c) => c.id === f.categoryId)!;
    const id = f.id || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || uid("svc-");
    saveService({ ...f, id, includes: includes.split("\n").map((x) => x.trim()).filter(Boolean), art: isNew ? cat.art : f.art, tone: isNew ? cat.tone : f.tone });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={isNew ? "New service" : `Edit ${svc.name}`} size="lg">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <SmallField label="Service name" className="sm:col-span-2">
          <input required value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </SmallField>
        <SmallField label="Category">
          <select value={f.categoryId} onChange={(e) => set("categoryId", e.target.value as CategoryId)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </SmallField>
        <SmallField label="Short tagline">
          <input value={f.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} />
        </SmallField>
        <SmallField label="Description" className="sm:col-span-2">
          <textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} className={inputCls} />
        </SmallField>
        <div className="grid grid-cols-3 gap-3 sm:col-span-2">
          <SmallField label="Price ($)">
            <input type="number" min={0} required value={f.price} onChange={(e) => set("price", +e.target.value)} className={inputCls} />
          </SmallField>
          <SmallField label="Deposit ($)">
            <input type="number" min={0} required value={f.deposit} onChange={(e) => set("deposit", +e.target.value)} className={inputCls} />
          </SmallField>
          <SmallField label="Duration (min)">
            <input type="number" min={15} step={15} required value={f.minutes} onChange={(e) => set("minutes", +e.target.value)} className={inputCls} />
          </SmallField>
        </div>
        <SmallField label="Suitable hair type">
          <input value={f.suitableFor} onChange={(e) => set("suitableFor", e.target.value)} className={inputCls} />
        </SmallField>
        <SmallField label="Preparation instructions">
          <input value={f.prep} onChange={(e) => set("prep", e.target.value)} className={inputCls} />
        </SmallField>
        <SmallField label="What's included (one per line)" className="sm:col-span-2">
          <textarea rows={3} value={includes} onChange={(e) => setIncludes(e.target.value)} className={inputCls} />
        </SmallField>
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:flex-wrap sm:gap-6">
          <Toggle label="Active" checked={f.active} onChange={(v) => set("active", v)} />
          <Toggle label="Price shown as “from”" checked={f.priceFrom} onChange={(v) => set("priceFrom", v)} />
          <Toggle label="Hair included" checked={f.hairIncluded} onChange={(v) => set("hairIncluded", v)} />
          <Toggle label="Consultation first" checked={f.consultation} onChange={(v) => set("consultation", v)} />
          <Toggle label="Featured" checked={f.popular} onChange={(v) => set("popular", v)} />
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-xs font-semibold">Stylists who offer it</legend>
          <div className="flex flex-wrap gap-2">
            {s.stylists.map((st) => (
              <label key={st.id} className={cn("inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-sm ring-1", f.stylistIds.includes(st.id) ? "bg-ink text-ivory ring-ink" : "ring-line")}>
                <input type="checkbox" className="sr-only" checked={f.stylistIds.includes(st.id)} onChange={() => toggle("stylistIds", st.id)} /> {st.name}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-xs font-semibold">Available add-ons</legend>
          <div className="flex flex-wrap gap-2">
            {s.addOns.map((a) => (
              <label key={a.id} className={cn("inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-sm ring-1", f.addOnIds.includes(a.id) ? "bg-ink text-ivory ring-ink" : "ring-line")}>
                <input type="checkbox" className="sr-only" checked={f.addOnIds.includes(a.id)} onChange={() => toggle("addOnIds", a.id)} /> {a.name} +{money(a.price)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex items-center gap-4 sm:col-span-2">
          <Photo art={f.art} tone={f.tone} path={f.id ? `services/${f.id}` : undefined} src={f.image} alt="" className="size-20 rounded-xl" />
          <button type="button" className={btn2} onClick={() => fileRef.current?.click()}>
            <ImagePlus className="size-4" aria-hidden /> Upload main photo
          </button>
          {f.image ? (
            <button type="button" className="text-xs text-error" onClick={() => set("image", undefined)}>
              Remove
            </button>
          ) : null}
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={async (e) => e.target.files?.[0] && set("image", await readImage(e.target.files[0]))} />
        </div>
        <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
          <button type="button" onClick={onClose} className="min-h-10 rounded-full px-5 text-sm font-semibold">
            Cancel
          </button>
          <button className={btn}>{isNew ? "Create service" : "Save changes"}</button>
        </div>
      </form>
    </Modal>
  );
}

// -------------------------------- Staff ---------------------------------

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function StaffAdmin() {
  const s = useStore();
  const [edit, setEdit] = useState<Stylist | null>(null);
  const since = dateKey(subDays(new Date(), 30));
  return (
    <>
      <StudioTitle
        title="Staff"
        sub="Profiles, working hours, time off and performance"
        actions={
          <button
            className={btn}
            onClick={() =>
              setEdit({ id: "", name: "", title: "Stylist", rating: 5, appointments: 0, years: 1, specialties: [], bio: "", quote: "", workDays: [2, 4, 5, 6], start: "09:00", end: "18:00", commission: 40, active: true, art: "bun", tone: "sand" })
            }
          >
            <Plus className="size-4" aria-hidden /> Add stylist
          </button>
        }
      />
      <div className="grid gap-5 md:grid-cols-2">
        {s.stylists.map((st) => {
          const recent = s.appointments.filter((a) => a.stylistId === st.id && a.date >= since && a.status === "completed");
          const revenue = recent.reduce((t, a) => t + a.total, 0);
          const upcoming = s.appointments.filter((a) => a.stylistId === st.id && a.date >= dateKey(new Date()) && (a.status === "confirmed" || a.status === "pending")).length;
          return (
            <Panel key={st.id} className={cn(!st.active && "opacity-60")}>
              <div className="flex gap-4">
                <Photo art={st.art} tone={st.tone} path={`stylists/${st.id}`} src={st.image} alt="" className="size-20 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-3xl leading-none">{st.name}</p>
                      <p className="mt-1 text-xs text-muted">{st.title}</p>
                    </div>
                    <button className={btn2} onClick={() => setEdit(st)}>
                      <Pencil className="size-3.5" aria-hidden /> Edit
                    </button>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs">
                    <Stars rating={st.rating} /> {st.rating} · {st.years} yrs · {st.commission}% commission
                  </p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
                <div>
                  <dt className="text-[0.65rem] tracking-wider text-muted uppercase">Upcoming</dt>
                  <dd className="font-display text-3xl">{upcoming}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] tracking-wider text-muted uppercase">Done (30d)</dt>
                  <dd className="font-display text-3xl">{recent.length}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] tracking-wider text-muted uppercase">Revenue (30d)</dt>
                  <dd className="font-display text-3xl">{money(revenue)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-muted">
                Works {st.workDays.map((d) => DAYS[d]).join(", ")} · {st.start}–{st.end}
              </p>
            </Panel>
          );
        })}
      </div>
      {edit ? <StylistEditor st={edit} onClose={() => setEdit(null)} /> : null}
    </>
  );
}

function StylistEditor({ st, onClose }: { st: Stylist; onClose: () => void }) {
  const s = useStore();
  const [f, setF] = useState(st);
  const [specialties, setSpecialties] = useState(st.specialties.join(", "));
  const [off, setOff] = useState({ from: "", to: "", reason: "Vacation" });
  const set = <K extends keyof Stylist>(k: K, v: Stylist[K]) => setF((p) => ({ ...p, [k]: v }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    saveStylist({ ...f, id: f.id || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || uid("st-"), specialties: specialties.split(",").map((x) => x.trim()).filter(Boolean) });
    onClose();
  };
  const addTimeOff = () => {
    if (!off.from || !st.id) return;
    const to = off.to || off.from;
    for (let d = new Date(`${off.from}T00:00`); dateKey(d) <= to; d.setDate(d.getDate() + 1)) addBlock({ date: dateKey(d), stylistId: st.id, reason: off.reason || "Time off" });
    setOff({ from: "", to: "", reason: "Vacation" });
  };
  const timeOff = s.blocks.filter((b) => b.stylistId === st.id && !b.start);
  return (
    <Modal open onClose={onClose} title={st.id ? `Edit ${st.name}` : "Add stylist"} size="lg">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <SmallField label="Name">
          <input required value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </SmallField>
        <SmallField label="Title">
          <input value={f.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
        </SmallField>
        <SmallField label="Bio" className="sm:col-span-2">
          <textarea rows={3} value={f.bio} onChange={(e) => set("bio", e.target.value)} className={inputCls} />
        </SmallField>
        <SmallField label="Specialties (comma separated)" className="sm:col-span-2">
          <input value={specialties} onChange={(e) => setSpecialties(e.target.value)} className={inputCls} />
        </SmallField>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-xs font-semibold">Working days</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d, i) => (
              <label key={d} className={cn("inline-flex min-h-9 min-w-12 cursor-pointer items-center justify-center rounded-full px-3 text-sm ring-1", f.workDays.includes(i) ? "bg-ink text-ivory ring-ink" : "ring-line")}>
                <input type="checkbox" className="sr-only" checked={f.workDays.includes(i)} onChange={() => set("workDays", f.workDays.includes(i) ? f.workDays.filter((x) => x !== i) : [...f.workDays, i].sort())} />
                {d}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-3 gap-3 sm:col-span-2">
          <SmallField label="Starts">
            <input type="time" value={f.start} onChange={(e) => set("start", e.target.value)} className={inputCls} />
          </SmallField>
          <SmallField label="Ends">
            <input type="time" value={f.end} onChange={(e) => set("end", e.target.value)} className={inputCls} />
          </SmallField>
          <SmallField label="Commission %">
            <input type="number" min={0} max={100} value={f.commission} onChange={(e) => set("commission", +e.target.value)} className={inputCls} />
          </SmallField>
        </div>
        <div className="sm:col-span-2">
          <Toggle label="Taking bookings" checked={f.active} onChange={(v) => set("active", v)} />
        </div>
        {st.id ? (
          <fieldset className="rounded-xl bg-cream p-4 sm:col-span-2">
            <legend className="px-1 text-xs font-semibold">Time off & breaks</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <input type="date" aria-label="From" value={off.from} onChange={(e) => setOff({ ...off, from: e.target.value })} className={inputCls} />
              <input type="date" aria-label="To" value={off.to} onChange={(e) => setOff({ ...off, to: e.target.value })} className={inputCls} />
              <input aria-label="Reason" value={off.reason} onChange={(e) => setOff({ ...off, reason: e.target.value })} className={inputCls} />
              <button type="button" onClick={addTimeOff} className={btn2}>
                Add time off
              </button>
            </div>
            {timeOff.length ? <p className="mt-3 text-xs text-muted">Booked off: {timeOff.map((b) => b.date).join(", ")}. Daily breaks can be added from the calendar's Block time.</p> : null}
          </fieldset>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
          <button type="button" onClick={onClose} className="min-h-10 rounded-full px-5 text-sm font-semibold">
            Cancel
          </button>
          <button className={btn}>Save</button>
        </div>
      </form>
    </Modal>
  );
}

// -------------------------------- Gallery -------------------------------

const LABELS: GalleryLabel[] = ["Braids", "Wigs", "Natural Hair", "Locs", "Silk Press", "Colour", "Bridal"];

export function GalleryAdmin() {
  const s = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [edit, setEdit] = useState<GalleryItem | null>(null);
  return (
    <>
      <StudioTitle
        title="Gallery"
        sub="Photos shown on the lookbook, homepage and service pages"
        actions={
          <button className={btn} onClick={() => fileRef.current?.click()}>
            <ImagePlus className="size-4" aria-hidden /> Upload photo
          </button>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const image = await readImage(f, 1000);
          setEdit({ id: uid("g-"), title: "", label: "Braids", serviceId: s.services[0].id, art: "braids", tone: "sand", shape: "tall", image });
          e.target.value = "";
        }}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {s.gallery.map((g) => (
          <div key={g.id} className="group overflow-hidden rounded-2xl bg-white ring-1 ring-line/70">
            <Photo path={`gallery/${g.id}`} src={g.image} art={g.art} tone={g.tone} alt={g.title} className="aspect-[4/5]" />
            <div className="p-3">
              <p className="truncate text-sm font-semibold">{g.title}</p>
              <p className="text-xs text-muted">{g.label}</p>
              <div className="mt-2 flex gap-1.5">
                <button className={btn2} onClick={() => setEdit(g)}>
                  <Pencil className="size-3.5" aria-hidden /> Edit
                </button>
                <button className={cn(btn2, "hover:border-error hover:text-error")} onClick={() => removeGalleryItem(g.id)} aria-label={`Delete ${g.title}`}>
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {edit ? (
        <Modal open onClose={() => setEdit(null)} title={edit.title ? `Edit ${edit.title}` : "New gallery photo"}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveGalleryItem(edit);
              setEdit(null);
            }}
            className="grid gap-4"
          >
            <Photo path={`gallery/${edit.id}`} src={edit.image} art={edit.art} tone={edit.tone} alt="" className="mx-auto aspect-[4/5] w-40 rounded-xl" />
            <SmallField label="Title">
              <input required value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className={inputCls} placeholder="e.g. Waist-length boho braids" />
            </SmallField>
            <SmallField label="Filter category">
              <select value={edit.label} onChange={(e) => setEdit({ ...edit, label: e.target.value as GalleryLabel })} className={inputCls}>
                {LABELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </SmallField>
            <SmallField label="“Book this look” links to">
              <select value={edit.serviceId} onChange={(e) => setEdit({ ...edit, serviceId: e.target.value })} className={inputCls}>
                {s.services.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </SmallField>
            <SmallField label="Shape in lookbook">
              <select value={edit.shape} onChange={(e) => setEdit({ ...edit, shape: e.target.value as GalleryItem["shape"] })} className={inputCls}>
                <option value="tall">Portrait</option>
                <option value="square">Square</option>
                <option value="wide">Landscape</option>
              </select>
            </SmallField>
            <button className={btn}>Save photo</button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

// ------------------------------- Discounts ------------------------------

export function DiscountsAdmin() {
  const s = useStore();
  const [edit, setEdit] = useState<{ d: Discount; original?: string } | null>(null);
  return (
    <>
      <StudioTitle
        title="Discounts"
        sub="Use sparingly. Premium brands rarely shout about sales."
        actions={
          <button className={btn} onClick={() => setEdit({ d: { code: "", description: "", type: "percent", value: 10, firstVisitOnly: false, active: true, uses: 0 } })}>
            <Plus className="size-4" aria-hidden /> New code
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {s.discounts.map((d) => (
          <Panel key={d.code}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-lg font-semibold tracking-widest">{d.code}</p>
                <p className="text-sm text-muted">{d.description}</p>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", d.active ? "bg-success-soft text-success" : "bg-sand text-muted")}>{d.active ? "Active" : "Paused"}</span>
            </div>
            <p className="mt-4 font-display text-4xl">{d.type === "percent" ? `${d.value}% off` : `${money(d.value)} off`}</p>
            <p className="mt-1 text-xs text-muted">
              Used {d.uses} times{d.firstVisitOnly ? " · First visit only" : ""}
            </p>
            <div className="mt-4 flex gap-2">
              <button className={btn2} onClick={() => saveDiscount({ ...d, active: !d.active })}>
                {d.active ? "Pause" : "Activate"}
              </button>
              <button className={btn2} onClick={() => setEdit({ d, original: d.code })}>
                <Pencil className="size-3.5" aria-hidden /> Edit
              </button>
              <button className={cn(btn2, "hover:text-error")} onClick={() => deleteDiscount(d.code)} aria-label={`Delete ${d.code}`}>
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </div>
          </Panel>
        ))}
      </div>
      {edit ? (
        <Modal open onClose={() => setEdit(null)} title={edit.original ? `Edit ${edit.original}` : "New discount code"}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveDiscount({ ...edit.d, code: edit.d.code.toUpperCase().replace(/\s/g, "") }, edit.original);
              setEdit(null);
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <SmallField label="Code">
              <input required value={edit.d.code} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, code: e.target.value.toUpperCase() } })} className={cn(inputCls, "font-mono uppercase")} />
            </SmallField>
            <SmallField label="Type">
              <select value={edit.d.type} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, type: e.target.value as Discount["type"] } })} className={inputCls}>
                <option value="percent">Percent off</option>
                <option value="amount">Dollar amount off</option>
              </select>
            </SmallField>
            <SmallField label={edit.d.type === "percent" ? "Percent" : "Amount ($)"}>
              <input type="number" min={1} max={edit.d.type === "percent" ? 100 : undefined} value={edit.d.value} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, value: +e.target.value } })} className={inputCls} />
            </SmallField>
            <SmallField label="Description">
              <input value={edit.d.description} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, description: e.target.value } })} className={inputCls} />
            </SmallField>
            <div className="sm:col-span-2">
              <Toggle label="First visit only" checked={edit.d.firstVisitOnly} onChange={(v) => setEdit({ ...edit, d: { ...edit.d, firstVisitOnly: v } })} />
            </div>
            <button className={cn(btn, "justify-center sm:col-span-2")}>Save code</button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
