import { QRCodeSVG } from "qrcode.react";
import { CUSTOMER_URL, STAFF_URL, type Restaurant } from "@/lib/supabase";
import { Card, btnGhost } from "./ui";

export function GoLive({ restaurant, live }: { restaurant: Restaurant; live: boolean }) {
  const base = CUSTOMER_URL || window.location.origin.replace("register.", "order.");
  const link = `${base}/${restaurant.slug}`;
  const tables = Array.from({ length: restaurant.table_count }, (_, i) => i + 1);

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="mb-1 text-xl font-bold text-slate-900">{live ? "🎉 You're live!" : "Almost there"}</h2>
        {!live && <p className="text-sm text-amber-700">Your restaurant isn't live until the subscription is active.</p>}
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="font-semibold text-slate-700">Customer ordering link</p>
            <a href={link} target="_blank" rel="noreferrer" className="break-all text-red-600 underline">
              {link}
            </a>
          </div>
          {STAFF_URL && (
            <div>
              <p className="font-semibold text-slate-700">Staff login (cashier, kitchen, admin)</p>
              <a href={STAFF_URL} target="_blank" rel="noreferrer" className="break-all text-red-600 underline">
                {STAFF_URL}
              </a>
              <p className="text-xs text-slate-500">Sign in with the same email you registered with — you're the manager.</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between print:hidden">
          <h3 className="font-bold text-slate-900">Table QR codes</h3>
          <button onClick={() => window.print()} className={btnGhost}>
            Print
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {tables.map((t) => (
            <div key={t} className="rounded-xl border border-slate-200 p-3 text-center [break-inside:avoid]">
              <QRCodeSVG value={`${link}?table=${t}`} size={128} className="mx-auto" />
              <p className="mt-2 text-sm font-bold text-slate-900">Table {t}</p>
              <p className="text-[10px] text-slate-500">{restaurant.name}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
