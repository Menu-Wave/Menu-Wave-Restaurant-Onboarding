import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Building2, Hash, ImagePlus, Link2, Table2, Upload, X } from "lucide-react";
import { supabase, uploadRestaurantLogo } from "@/lib/supabase";
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
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const logoPreview = useMemo(() => (logo ? URL.createObjectURL(logo) : null), [logo]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  useEffect(() => {
    setAvailable(null);
    if (slug.length < 3) return;
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("slug_available", { p_slug: slug });
      setAvailable(data === true);
    }, 350);
    return () => clearTimeout(t);
  }, [slug]);

  const chooseLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Use a JPG, PNG or WebP logo.");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Restaurant logo must be under 2 MB.");
      e.target.value = "";
      return;
    }
    setError(null);
    setLogo(file);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { error: registerError } = await supabase.rpc("register_restaurant", {
      p_name: name,
      p_slug: slug,
      p_table_count: Number(tables),
      p_order_code_prefix: prefix,
      p_currency: currency,
    });

    if (registerError) {
      setBusy(false);
      setError(registerError.message);
      return;
    }

    if (logo) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Please sign in again.");

        const { data: staff, error: staffError } = await supabase
          .from("staff")
          .select("restaurant_id")
          .eq("id", userData.user.id)
          .single();

        if (staffError || !staff?.restaurant_id) {
          throw new Error("Restaurant created, but we couldn't prepare the logo upload.");
        }

        await uploadRestaurantLogo(Number(staff.restaurant_id), logo);
      } catch (logoError) {
        setBusy(false);
        setError(
          logoError instanceof Error
            ? `${logoError.message} Your restaurant was created successfully; you can add the logo later.`
            : "Your restaurant was created, but the logo could not be uploaded. You can add it later."
        );
        return;
      }
    }

    setBusy(false);
    onDone();
  };

  return (
    <Card className="mw-setup-card">
      <div className="mw-step-heading">
        <span><Building2 size={21} /></span>
        <div>
          <p className="mw-kicker">YOUR RESTAURANT</p>
          <h2>Tell us about your space.</h2>
          <p>We'll use these details to create your customer ordering link and table experience.</p>
        </div>
      </div>

      <form onSubmit={submit} className="mw-setup-form">
        <Field label="Restaurant name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            maxLength={80}
            placeholder="e.g. Kemi's Kitchen"
          />
        </Field>

        <div className="mw-logo-field">
          <div className="mw-logo-field-copy">
            <span>Restaurant logo <small>Optional</small></span>
            <p>This appears on your table QR cards and restaurant branding. JPG, PNG or WebP, up to 2 MB.</p>
          </div>

          <div className="mw-logo-uploader">
            <div className="mw-logo-preview">
              {logoPreview ? (
                <img src={logoPreview} alt="Restaurant logo preview" />
              ) : (
                <ImagePlus size={25} />
              )}
            </div>

            <div className="mw-logo-actions">
              <label className="mw-logo-upload-button">
                <Upload size={15} />
                {logo ? "Replace logo" : "Upload logo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={chooseLogo}
                />
              </label>

              {logo && (
                <button type="button" className="mw-logo-remove" onClick={() => setLogo(null)}>
                  <X size={14} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <Field
          label="Your customer ordering link"
          hint={
            slug.length < 3
              ? "Choose at least 3 characters"
              : available === null
                ? "Checking availability…"
                : available
                  ? "✓ This link is available"
                  : "✗ Already taken — try another"
          }
        >
          <div className="mw-prefix-input">
            <span><Link2 size={15} /> /</span>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className={inputCls}
            />
          </div>
        </Field>

        <div className="mw-two-fields">
          <Field label="How many tables?">
            <div className="mw-icon-input">
              <Table2 size={17} />
              <input
                type="number"
                min={1}
                max={200}
                required
                value={tables}
                onChange={(e) => setTables(e.target.value)}
                className={inputCls}
              />
            </div>
          </Field>

          <Field label="Order code" hint={`Orders will look like ${prefix || "KK"}-K7M2PQ`}>
            <div className="mw-icon-input">
              <Hash size={17} />
              <input
                required
                value={prefix}
                onChange={(e) =>
                  setPrefix(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5))
                }
                className={inputCls}
                placeholder="KK"
              />
            </div>
          </Field>
        </div>

        <Field label="Currency">
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
            <option value="NGN">Nigerian Naira (₦)</option>
            <option value="GHS">Ghanaian Cedi (GH₵)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="GBP">British Pound (£)</option>
            <option value="EUR">Euro (€)</option>
            <option value="KES">Kenyan Shilling (KSh)</option>
            <option value="ZAR">South African Rand (R)</option>
          </select>
        </Field>

        <ErrorBox message={error} />
        <button disabled={busy || available === false || prefix.length < 2} className={btnPrimary}>
          {busy ? (logo ? "Creating restaurant & adding logo…" : "Creating your restaurant…") : "Continue to plans →"}
        </button>
      </form>
    </Card>
  );
}

