import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Field, ErrorBox, inputCls, btnPrimary } from "./ui";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function RestaurantStep({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [tables, setTables] = useState("10");
  const [prefix, setPrefix] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // Debounced availability check.
  useEffect(() => {
    setAvailable(null);
    if (slug.length < 3) return;
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("slug_available", { p_slug: slug });
      setAvailable(data === true);
    }, 350);
    return () => clearTimeout(t);
  }, [slug]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.rpc("register_restaurant", {
      p_name: name,
      p_slug: slug,
      p_table_count: Number(tables),
      p_order_code_prefix: prefix,
      p_currency: currency,
    });
    setBusy(false);
    if (error) return setError(error.message);
    onDone();
  };

  return (
    <Card>
      <h2 className="mb-1 text-xl font-bold text-slate-900">Your restaurant</h2>
      <p className="mb-6 text-sm text-slate-500">These details create your ordering link. You can't change the link later.</p>
      <form onSubmit={submit}>
        <Field label="Restaurant name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} maxLength={80} />
        </Field>
        <Field
          label="Ordering link"
          hint={
            slug.length < 3
              ? "Letters, numbers and dashes"
              : available === null
                ? "Checking…"
                : available
                  ? "✓ Available"
                  : "✗ Not available — try another"
          }
        >
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Number of tables">
            <input type="number" min={1} max={200} required value={tables} onChange={(e) => setTables(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Order code prefix" hint="2–5 letters, e.g. CR → CR-K7M2PQ">
            <input required value={prefix} onChange={(e) => setPrefix(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5))} className={inputCls} />
          </Field>
        </div>
        <Field label="Currency">
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
            <option value="NGN">Naira (₦)</option>
          </select>
        </Field>
        <ErrorBox message={error} />
        <button disabled={busy || available === false || prefix.length < 2} className={btnPrimary}>
          {busy ? "Creating…" : "Continue"}
        </button>
      </form>
    </Card>
  );
}
