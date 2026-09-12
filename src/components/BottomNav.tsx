"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/review", label: "Review" },
  { href: "/calendar", label: "Streak" },
  { href: "/parent", label: "Parent" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-sky-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center rounded-xl px-1 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-amber-200 text-amber-950"
                    : "text-sky-700 hover:bg-sky-100"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
