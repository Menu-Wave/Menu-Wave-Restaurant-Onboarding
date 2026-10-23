import { QRCodeSVG } from "qrcode.react";
import { CUSTOMER_URL, STAFF_URL, type Restaurant } from "@/lib/supabase";
import { Card, btnGhost } from "./ui";

export function GoLive({
  restaurant,
  live,
}: {
  restaurant: Restaurant;
  live: boolean;
}) {
  // Customer-facing Menu-Wave application.
  const customerBase =
    CUSTOMER_URL || "https://menu-wave-customer.vercel.app";

  // Restaurant management portal.
  const staffBase =
    STAFF_URL || "https://menu-wave-end.vercel.app";

  // Public ordering page for this specific restaurant.
  const customerLink = `${customerBase.replace(/\/$/, "")}/${restaurant.slug}`;

  // All restaurant workers use the same management portal.
  // Supabase authentication determines their restaurant and role.
  const staffLink = staffBase.replace(/\/$/, "");

  const tables = Array.from(
    { length: restaurant.table_count },
    (_, i) => i + 1
  );

  return (
    <div className="space-y-5">
      {/* Restaurant activated */}
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
            now manage your restaurant and set up your menu from the restaurant
            management portal.
          </p>
        )}

        <div className="mt-6 space-y-5">
          {/* Customer site */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-semibold text-slate-900">
              Customer ordering site
            </p>

            <p className="mt-1 text-xs text-slate-500">
              This is the public link your customers will use to view your menu
              and place orders.
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

          {/* Restaurant management */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-semibold text-slate-900">
              Restaurant management portal
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Use the management portal to set up your menu, manage orders,
              update prices, manage staff, and operate your restaurant.
            </p>

            <a
              href={staffLink}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Manage restaurant
            </a>

            <p className="mt-2 text-xs text-slate-500">
              Sign in using the same email account you used during restaurant
              registration. Your account is linked to this restaurant as its
              owner.
            </p>
          </div>
        </div>
      </Card>

      {/* QR codes */}
      <Card>
        <div className="mb-2 flex items-center justify-between print:hidden">
          <div>
            <h3 className="font-bold text-slate-900">Table QR codes</h3>

            <p className="mt-1 text-xs text-slate-500">
              Print and place the correct QR code on each table. Customers can
              scan it to open your restaurant ordering page with their table
              number.
            </p>
          </div>

          <button onClick={() => window.print()} className={btnGhost}>
            Print QR codes
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {tables.map((tableNumber) => {
            const tableLink = `${customerLink}?table=${tableNumber}`;

            return (
              <div
                key={tableNumber}
                className="rounded-xl border border-slate-200 p-3 text-center [break-inside:avoid]"
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
  );
}