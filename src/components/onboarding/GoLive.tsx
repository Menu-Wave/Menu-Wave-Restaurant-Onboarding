import { QRCodeSVG } from "qrcode.react";
import type { Restaurant } from "@/lib/supabase";
import { Card, btnGhost } from "./ui";
import { Check, ExternalLink, LayoutDashboard, QrCode } from "lucide-react";

const CUSTOMER_APP_URL = "https://menu-wave-customer.vercel.app";
const RESTAURANT_APP_URL = "https://menu-wave-end.vercel.app";

function RestaurantIdentity({
  restaurant,
  print = false,
}: {
  restaurant: Restaurant;
  print?: boolean;
}) {
  const initials = restaurant.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (restaurant.logo_url) {
    return (
      <img
        src={restaurant.logo_url}
        alt={`${restaurant.name} logo`}
        className={print ? "qr-print-restaurant-logo" : "mw-qr-restaurant-logo"}
      />
    );
  }

  return (
    <div className={print ? "qr-print-logo-fallback" : "mw-qr-logo-fallback"} aria-label={`${restaurant.name} logo fallback`}>
      {initials || "R"}
    </div>
  );
}

export function GoLive({
  restaurant,
  live,
}: {
  restaurant: Restaurant;
  live: boolean;
}) {
  const customerLink = `${CUSTOMER_APP_URL}/${restaurant.slug}`;
  const tables = Array.from({ length: restaurant.table_count }, (_, i) => i + 1);

  return (
    <>
      <div className="space-y-5 print:hidden">
        <Card>
          <div className="mw-live-title">
            <span><Check size={22} /></span>
            <div>
              <p className="mw-kicker">GO LIVE</p>
              <h2>{live ? `${restaurant.name} is ready.` : "Almost there"}</h2>
            </div>
          </div>

          {!live && (
            <p className="text-sm text-amber-700">
              Your restaurant isn't live until your subscription or trial is active.
            </p>
          )}

          {live && (
            <p className="mt-1 text-sm text-slate-600">
              Your Menu-Wave workspace is ready. Add your menu, invite your team and print your table QR codes from the management portal.
            </p>
          )}

          <div className="mt-6 space-y-4">
            <div className="mw-live-link-card">
              <p className="font-semibold text-slate-900">Customer ordering site</p>
              <p className="mt-1 text-xs text-slate-500">
                Share this link with customers. Your table QR codes also direct customers to this ordering site.
              </p>
              <a href={customerLink} target="_blank" rel="noreferrer" className="mw-live-url">
                {customerLink} <ExternalLink size={14} />
              </a>
            </div>

            <div className="mw-live-link-card">
              <p className="font-semibold text-slate-900">Restaurant management portal</p>
              <p className="mt-1 text-xs text-slate-500">
                Set up your menu, manage orders, update prices and operate your restaurant from the Menu-Wave management portal.
              </p>
              <a href={RESTAURANT_APP_URL} target="_blank" rel="noreferrer" className="mw-management-link">
                <LayoutDashboard size={16} /> Open management portal
              </a>
              <p className="mt-2 text-xs text-slate-500">
                Sign in using the same account you used to register your restaurant.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="mw-qr-heading"><QrCode size={18} /> Table QR codes</h3>
              <p className="mt-1 text-xs text-slate-500">
                Each card uses your restaurant identity. Print and place the matching QR code on each table.
              </p>
            </div>

            <button type="button" onClick={() => window.print()} className={btnGhost}>
              Print QR codes
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {tables.map((tableNumber) => {
              const tableLink = `${customerLink}?table=${tableNumber}`;

              return (
                <div key={tableNumber} className="mw-qr-preview-card">
                  <RestaurantIdentity restaurant={restaurant} />
                  <p className="mw-qr-preview-name">{restaurant.name}</p>
                  <QRCodeSVG value={tableLink} size={128} className="mx-auto" />
                  <p className="mt-3 text-sm font-bold text-slate-900">Table {tableNumber}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Scan to order</p>
                  <p className="mw-qr-powered">Powered by <strong>Menu-Wave</strong></p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="qr-print-area" aria-hidden="true">
        {tables.map((tableNumber) => {
          const tableLink = `${customerLink}?table=${tableNumber}`;

          return (
            <article key={tableNumber} className="qr-print-card">
              <RestaurantIdentity restaurant={restaurant} print />
              <p className="qr-print-restaurant">{restaurant.name}</p>
              <p className="qr-print-table">Table {tableNumber}</p>
              <QRCodeSVG value={tableLink} size={180} />
              <p className="qr-print-instruction">Scan to order</p>
              <div className="qr-print-brand">
                <img src="/menu-wave-logo.png" alt="" />
                <span>Powered by Menu-Wave</span>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
