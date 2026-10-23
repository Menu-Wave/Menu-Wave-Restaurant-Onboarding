import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase, uploadMenuImage, type Category, type MenuItem, type Restaurant } from "@/lib/supabase";
import { Card, Field, ErrorBox, inputCls, btnPrimary, btnGhost } from "./ui";

type Row = { name: string; price: number; category: string; emoji: string | null };

// Accepts tab- or comma-separated lines: name, price, category[, emoji]. Header row is skipped automatically.
function parseBulk(text: string): { rows: Row[]; errors: string[] } {
  const rows: Row[] = [];
  const errors: string[] = [];
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line, i) => {
      const parts = (line.includes("\t") ? line.split("\t") : line.split(",")).map((p) => p.trim());
      const [name, priceRaw, category, emoji] = parts;
      const price = Number((priceRaw ?? "").replace(/[₦$£€,\s]/g, ""));
      if (i === 0 && /^name$/i.test(name ?? "")) return;
      if (!name || !category || !Number.isFinite(price) || price <= 0) {
        errors.push(`Line ${i + 1}: "${line.slice(0, 40)}" — need name, price, category`);
        return;
      }
      rows.push({ name, price, category, emoji: emoji || null });
    });
  return { rows, errors };
}

export function MenuStep({ restaurant, onContinue }: { restaurant: Restaurant; onContinue: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [catName, setCatName] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [emoji, setEmoji] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const reload = useCallback(async () => {
    const [c, m] = await Promise.all([
      supabase.from("categories").select("id, name, display_order").eq("restaurant_id", restaurant.id).order("display_order"),
      supabase.from("menu_items").select("id, name, price, category, emoji, image_url").eq("restaurant_id", restaurant.id).order("id"),
    ]);
    setCategories((c.data as Category[]) ?? []);
    setItems((m.data as MenuItem[]) ?? []);
  }, [restaurant.id]);

  useEffect(() => {
    reload();
  }, [reload]);
  useEffect(() => {
    if (!category && categories.length) setCategory(categories[0].name);
  }, [categories, category]);

  const ensureCategories = async (names: string[]) => {
    const existing = new Set(categories.map((c) => c.name.toLowerCase()));
    let order = categories.length ? Math.max(...categories.map((c) => c.display_order)) + 1 : 1;
    const toCreate = [...new Set(names)].filter((n) => !existing.has(n.toLowerCase()));
    if (!toCreate.length) return;
    const { error } = await supabase
      .from("categories")
      .insert(toCreate.map((n) => ({ name: n, display_order: order++, restaurant_id: restaurant.id })));
    if (error) throw new Error(error.message);
  };

  const addCategory = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = catName.trim();
    if (!n) return;
    try {
      await ensureCategories([n]);
      setCatName("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add category");
    }
  };

  const addItem = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const p = Number(price);
    if (!name.trim() || !(p > 0) || !category) return setError("Name, a price above 0, and a category are required.");
    setBusy(true);
    try {
      const image_url = file ? await uploadMenuImage(restaurant.id, file) : null;
      const { error } = await supabase.from("menu_items").insert({
        name: name.trim(), price: p, category, emoji: emoji.trim() || null,
        image_url, is_available: true, restaurant_id: restaurant.id,
      });
      if (error) throw new Error(error.message);
      setName(""); setPrice(""); setEmoji(""); setFile(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add item");
    }
    setBusy(false);
  };

  const importBulk = async () => {
    setError(null);
    const { rows, errors } = parseBulk(bulk);
    if (errors.length) return setError(errors.slice(0, 5).join("\n") + (errors.length > 5 ? `\n…and ${errors.length - 5} more` : ""));
    if (!rows.length) return setError("Nothing to import.");
    setBusy(true);
    try {
      await ensureCategories(rows.map((r) => r.category));
      const { error } = await supabase
        .from("menu_items")
        .insert(rows.map((r) => ({ ...r, is_available: true, restaurant_id: restaurant.id })));
      if (error) throw new Error(error.message);
      setBulk("");
      setShowBulk(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    }
    setBusy(false);
  };

  const removeItem = async (id: number) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return setError(error.message);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="mb-1 text-xl font-bold text-slate-900">Build your menu</h2>
        <p className="mb-4 text-sm text-slate-500">
          Add categories, then items. You can edit everything later from the staff Admin screen.
        </p>
        <ErrorBox message={error} />
        <form onSubmit={addCategory} className="mb-2 flex gap-2">
          <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="New category, e.g. Drinks" className={inputCls} />
          <button className={btnGhost}>Add</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {c.name}
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-bold text-slate-900">Add an item</h3>
        <form onSubmit={addItem}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
            <Field label={`Price (${restaurant.currency})`}>
              <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {categories.length === 0 && <option value="">Add a category first</option>}
                {categories.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Emoji (optional)">
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className={inputCls} maxLength={4} />
            </Field>
          </div>
          <Field label="Photo (optional)" hint="JPG, PNG or WebP, up to 2 MB">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </Field>
          <button disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : "Add item"}
          </button>
        </form>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <button type="button" onClick={() => setShowBulk((v) => !v)} className="text-sm font-semibold text-red-600">
            {showBulk ? "Hide" : "Or paste many items from a spreadsheet"}
          </button>
          {showBulk && (
            <div className="mt-3">
              <textarea
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                rows={6}
                placeholder={"Jollof Rice, 2500, Mains, 🍚\nFried Chicken, 1800, Mains\nCoca-Cola, 500, Drinks"}
                className={`${inputCls} font-mono`}
              />
              <p className="mt-1 text-xs text-slate-500">One item per line: name, price, category, optional emoji. Copy-pasting columns from Excel/Sheets works too. Missing categories are created for you.</p>
              <button type="button" onClick={importBulk} disabled={busy} className={`${btnPrimary} mt-3`}>
                Import items
              </button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-bold text-slate-900">Your items ({items.length})</h3>
        {items.length === 0 && <p className="text-sm text-slate-400">Nothing yet.</p>}
        <ul className="divide-y divide-slate-100">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-2">
              {i.image_url ? (
                <img src={i.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100">{i.emoji ?? "🍽️"}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{i.name}</p>
                <p className="text-xs text-slate-500">
                  {i.category} · {Number(i.price).toLocaleString("en-NG")}
                </p>
              </div>
              <button onClick={() => removeItem(i.id)} className="text-xs font-semibold text-red-600">
                Remove
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex justify-end">
        <button onClick={onContinue} disabled={items.length === 0} className={btnPrimary}>
          Continue to plan
        </button>
      </div>
    </div>
  );
}
