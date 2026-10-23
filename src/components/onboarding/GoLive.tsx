import { QRCodeSVG } from "qrcode.react";
import type { Restaurant } from "@/lib/supabase";
import { Card, btnGhost } from "./ui";

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
      {/* Normal screen content */}
      <div className="space-y-5 print:hidden">
        <Card>
          <h2 className="mb-1 text-xl font-bold text-slate-900">
            {live ? "🎉 Your restaurant is ready!" : "Almost there"}
          </h2>

          {!live && (
            <p className="text-sm text-amber-700">
              Your restaurant isn't live until your subscription or trial is
              active.
            </p>
          )}

          {live && (
            <p className="mt-1 text-sm text-slate-600">
              Your Menu-Wave restaurant has been created successfully. You can
              now set up your menu and manage your restaurant from the
              management portal.
            </p>
          )}

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
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
                className="mt-2 block break-all text-sm font-medium text-red-600 underline"
              >
                {customerLink}
              </a>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
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
                className="mt-3 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Manage restaurant
              </a>

              <p className="mt-2 text-xs text-slate-500">
                Sign in using the same account you used to register your
                restaurant.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">
                Table QR codes
              </h3>

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
                  className="rounded-xl border border-slate-200 p-3 text-center"
                >
                  <QRCodeSVG
                    value={tableLink}
                    size={128}
                    className="mx-auto"
                  />

                  <p className="mt-2 text-sm font-bold text-slate-900">
                    Table {tableNumber}
                  </p>

                  <p className="text-[10px] text-slate-500">
                    {restaurant.name}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* PRINT-ONLY QR SHEET */}
      <div className="hidden print:block">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-black">
            {restaurant.name}
          </h1>

          <p className="mt-1 text-sm text-black">
            Menu-Wave Table QR Codes
          </p>

          <p className="mt-1 text-xs text-black">
            Scan the QR code on your table to view the menu and place an order.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {tables.map((tableNumber) => {
            const tableLink = `${customerLink}?table=${tableNumber}`;

            return (
              <div
                key={tableNumber}
                className="break-inside-avoid rounded-xl border-2 border-black p-5 text-center"
              >
                <p className="mb-3 text-lg font-bold text-black">
                  Table {tableNumber}
                </p>

                <QRCodeSVG
                  value={tableLink}
                  size={170}
                  className="mx-auto"
                />

                <p className="mt-3 text-sm font-bold text-black">
                  {restaurant.name}
                </p>

                <p className="mt-1 text-xs text-black">
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