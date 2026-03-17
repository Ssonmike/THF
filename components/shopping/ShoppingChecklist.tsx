"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatQuantity } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import styles from "@/components/shopping/ShoppingChecklist.module.css";

type ShoppingChecklistProps = {
  items: Array<{
    itemName: string;
    quantity: number;
    unit: string;
  }>;
};

export function ShoppingChecklist({ items }: ShoppingChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  return (
    <Card>
      <div className={styles.list}>
        {items.map((item) => {
          const key = `${item.itemName}-${item.unit}`;
          const isChecked = checked.has(key);

          return (
            <label key={key} className={styles.row}>
              <div className={styles.left}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() =>
                    setChecked((current) => {
                      const next = new Set(current);
                      if (next.has(key)) {
                        next.delete(key);
                      } else {
                        next.add(key);
                      }
                      return next;
                    })
                  }
                />
                <span className={cn(isChecked && styles.checked)}>{item.itemName}</span>
              </div>
              <strong className={cn(isChecked && styles.checked)}>
                {formatQuantity(item.quantity)} {item.unit}
              </strong>
            </label>
          );
        })}
      </div>
    </Card>
  );
}
