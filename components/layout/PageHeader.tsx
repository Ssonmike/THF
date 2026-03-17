import type { ReactNode } from "react";
import styles from "@/components/layout/PageHeader.module.css";

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className="pageTitle">{title}</h1>
        <p className="pageDescription">{description}</p>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
