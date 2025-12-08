import { useEffect } from "react";

export function useClickOutside(refOrRefs, handler) {
  useEffect(() => {
    const listener = (event) => {
      const refs = Array.isArray(refOrRefs) ? refOrRefs : [refOrRefs];
      const clickedInside = refs.some((r) => {
        const el = r?.current;
        return el && el.contains(event?.target || null);
      });
      if (clickedInside) return;
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refOrRefs, handler]);
}

