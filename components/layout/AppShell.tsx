"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import styles from "@/components/layout/AppShell.module.css";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/planner", label: "Planner" },
  { href: "/recipes", label: "Recipes" },
  { href: "/shopping-list", label: "Shopping List" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <div className={styles.inner}>
        <header className={styles.nav}>
          <div className={styles.brand}>
            <h1 className={styles.brandTitle}>Nutri Week</h1>
            <p className={styles.brandMeta}>Planificación semanal para Miguel y Ana</p>
          </div>
          <nav className={styles.links}>
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(styles.link, isActive && styles.active)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
