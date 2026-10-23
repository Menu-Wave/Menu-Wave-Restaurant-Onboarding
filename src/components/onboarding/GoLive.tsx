import { QRCodeSVG } from "qrcode.react";
import type { Restaurant } from "@/lib/supabase";
import { Card, btnGhost } from "./ui";
import { Check, ExternalLink, LayoutDashboard, QrCode } from "lucide-react";

const CUSTOMER_APP_URL = "https://menu-wave-customer.vercel.app";
const RESTAURANT_APP_URL = "https://menu-wave-end.vercel.app";

export function GoLive({
  restaurant,
  live,
}: {
  restaurant: Restaurant;
  live: boolean;
}) {
  const customerLink = `${CUSTOMER_APP_URL}/${restaurant.slug}`;

  const tables = Array.from(
    { length: restaurant.table_count },
    (_, i) => i + 1
  );

  return (
    <>
      {/* NORMAL SCREEN CONTENT */}
      <div className="space-y-5 print:hidden">
        <Card>
          <div className="mw-live-title"><span><Check size={22}/></span><div><p className="mw-kicker">GO LIVE</p><h2>{live ? `${restaurant.name} is ready.` : "Almost there"}</h2></div></div>

          {!live && (
            <p className="text-sm text-amber-700">
              Your restaurant isn't live until your subscription or trial is
              active.
            </p>
          )}

          {live && (
            <p className="mt-1 text-sm text-slate-600">
              Your Menu-Wave workspace is ready. Add your menu, invite your team and print your table QR codes from the management portal.
            </p>
          )}

          <div className="mt-6 space-y-4">
            {/* Customer ordering site */}
            <div className="mw-live-link-card">
              <p className="font-semibold text-slate-900">
                Customer ordering site
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Share this link with customers. Your table QR codes also direct
                customers to this ordering site.
              </p>

              <a
                href={customerLink}
                target="_blank"
                rel="noreferrer"
                className="mw-live-url"
              >
                {customerLink} <ExternalLink size={14}/></a>
            </div>

            {/* Restaurant management portal */}
            <div className="mw-live-link-card">
              <p className="font-semibold text-slate-900">
                Restaurant management portal
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Set up your menu, manage orders, update prices and operate your
                restaurant from the Menu-Wave management portal.
              </p>

              <a
                href={RESTAURANT_APP_URL}
                target="_blank"
                rel="noreferrer"
                className="mw-management-link"
              >
                <LayoutDashboard size={16}/> Open management portal
              </a>

              <p className="mt-2 text-xs text-slate-500">
                Sign in using the same account you used to register your
                restaurant.
              </p>
            </div>
          </div>
        </Card>

        {/* QR PREVIEW */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="mw-qr-heading"><QrCode size={18}/> Table QR codes</h3>

              <p className="mt-1 text-xs text-slate-500">
                Print and place the correct QR code on each restaurant table.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className={btnGhost}
            >
              Print QR codes
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {tables.map((tableNumber) => {
              const tableLink = `${customerLink}?table=${tableNumber}`;

              return (
                <div
                  key={tableNumber}
                  className="rounded-xl border border-slate-200 p-4 text-center"
                >
                  {/* Restaurant name */}
                  <p className="mb-3 font-bold text-slate-900">
                    {restaurant.name}
                  </p>

                  {/* QR code */}
                  <QRCodeSVG
                    value={tableLink}
                    size={128}
                    className="mx-auto"
                  />

                  {/* Table number */}
                  <p className="mt-3 text-sm font-bold text-slate-900">
                    Table {tableNumber}
                  </p>

                  {/* Scan instruction */}
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Scan to order
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* PRINT-ONLY QR CARDS */}
      <div className="hidden print:block">
        <div className="grid grid-cols-3 gap-6">
          {tables.map((tableNumber) => {
            const tableLink = `${customerLink}?table=${tableNumber}`;

            return (
              <div
                key={tableNumber}
                className="break-inside-avoid rounded-xl border-2 border-black p-6 text-center"
              >
                {/* 1. Restaurant name */}
                <p className="mb-4 text-xl font-bold text-black">
                  {restaurant.name}
                </p>

                {/* 2. QR code */}
                <QRCodeSVG
                  value={tableLink}
                  size={180}
                  className="mx-auto"
                />

                {/* 3. Table number */}
                <p className="mt-4 text-lg font-bold text-black">
                  Table {tableNumber}
                </p>

                {/* 4. Scan instruction */}
                <p className="mt-1 text-sm font-semibold text-black">
                  Scan to order
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}