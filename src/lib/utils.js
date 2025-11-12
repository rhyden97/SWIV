import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function mergeUniqueById(currentList = [], newItems = []) {
  const merged = new Map(currentList.map((item) => [item.id, item]));

  newItems.forEach((item) => {
    if (item?.id) {
      merged.set(item.id, item);
    }
  });

  return Array.from(merged.values());
}
