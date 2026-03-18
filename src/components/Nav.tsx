"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Nav.module.css";

const NAV_LINKS = [
  { href: "/", label: "Hoy", icon: "◎" },
  { href: "/recipes", label: "Recetas", icon: "☰" },
  { href: "/planner", label: "Planner", icon: "▦" },
  { href: "/shopping", label: "Compra", icon: "◻" },
] as const;

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandDot} aria-hidden="true" />
          <span className={styles.brandText}>TheHomeFood</span>
        </Link>

        <div className={styles.links} role="list">
          {NAV_LINKS.map(({ href, label, icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
                aria-current={isActive ? "page" : undefined}
                role="listitem"
              >
                <span className={styles.linkIcon} aria-hidden="true">
                  {icon}
                </span>
                <span className={styles.linkLabel}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
