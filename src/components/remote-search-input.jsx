"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function RemoteSearchInput({
  value,
  valueLabel,
  endpoint,
  queryParams = {},
  placeholder,
  disabled = false,
  minChars = 1,
  noResultsText = "No se encontraron resultados",
  loadingText = "Buscando...",
  getOptionLabel = (option) => option?.nombre ?? "",
  renderOptionLabel,
  onSelectOption,
  onClearSelection,
  onResultsLoaded,
  theme = "VENTAS",
}) {
  const [displayValue, setDisplayValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const inputRef = useRef(null);
  const blurTimerRef = useRef(null);
  const queryParamsKey = JSON.stringify(queryParams || {});
  const onResultsLoadedRef = useRef(onResultsLoaded);
  const onSelectOptionRef = useRef(onSelectOption);
  const onClearSelectionRef = useRef(onClearSelection);

  useEffect(() => {
    onResultsLoadedRef.current = onResultsLoaded;
  }, [onResultsLoaded]);

  useEffect(() => {
    onSelectOptionRef.current = onSelectOption;
  }, [onSelectOption]);

  useEffect(() => {
    onClearSelectionRef.current = onClearSelection;
  }, [onClearSelection]);

  useEffect(() => {
    if (valueLabel) {
      setDisplayValue(valueLabel);
    } else if (!value) {
      setDisplayValue("");
      setSearchTerm("");
      setResults([]);
    }
  }, [value, valueLabel]);

  useEffect(() => {
    if (!open || !inputRef.current) {
      return undefined;
    }

    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 60,
    });

    const updatePosition = () => {
      if (!inputRef.current) return;
      const nextRect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: nextRect.bottom + 6,
        left: nextRect.left,
        width: nextRect.width,
        zIndex: 60,
      });
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const search = searchTerm.trim();
    if (search.length < minChars) {
      setResults([]);
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const requestUrl = new URL(endpoint, window.location.origin);
        requestUrl.searchParams.set("q", search);

        Object.entries(queryParams || {}).forEach(([key, nextValue]) => {
          if (
            nextValue !== undefined &&
            nextValue !== null &&
            nextValue !== ""
          ) {
            requestUrl.searchParams.set(key, String(nextValue));
          }
        });

        const response = await fetch(requestUrl.toString(), {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Error buscando registros");
        }

        const data = await response.json();
        const normalizedResults = Array.isArray(data) ? data : [];
        setResults(normalizedResults);
        onResultsLoadedRef.current?.(normalizedResults);
      } catch (error) {
        if (error.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm, open, endpoint, minChars, queryParamsKey]);

  const optionLabel = useMemo(() => {
    return (option) => {
      if (renderOptionLabel) {
        return renderOptionLabel(option);
      }

      return getOptionLabel(option);
    };
  }, [getOptionLabel, renderOptionLabel]);

  const clearPendingBlur = () => {
    if (blurTimerRef.current) {
      window.clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  };

  const handleSelect = (option) => {
    clearPendingBlur();
    const label = optionLabel(option);
    setDisplayValue(label);
    setSearchTerm("");
    setResults([]);
    setOpen(false);
    onSelectOptionRef.current?.(option);
  };

  const handleClear = () => {
    setDisplayValue("");
    setSearchTerm("");
    setResults([]);
    onClearSelectionRef.current?.();
  };

  const dropdown =
    open && searchTerm.trim().length >= minChars && dropdownStyle
      ? createPortal(
          <div
            style={dropdownStyle}
            className="max-h-64 overflow-auto rounded-xs border border-border bg-popover text-popover-foreground shadow-sm py-1"
          >
            {isLoading ? (
              <div className="px-3 py-2 text-xs font-mono text-muted-foreground">
                {loadingText}
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-border/40">
                {results.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-xs font-mono transition-colors text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option)}
                  >
                    {optionLabel(option)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-xs font-mono text-muted-foreground">
                {noResultsText}
              </div>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="search"
        value={displayValue}
        placeholder={placeholder}
        className="h-9 w-full pl-9 pr-3 rounded-xs border-border bg-background text-xs font-mono placeholder:text-muted-foreground focus:border-primary touch-manipulation"
        disabled={disabled}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimerRef.current = window.setTimeout(() => setOpen(false), 120);
        }}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDisplayValue(nextValue);
          setSearchTerm(nextValue);
          setOpen(true);
          if (!nextValue) {
            handleClear();
            return;
          }

          onClearSelection?.();
        }}
      />
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

      {dropdown}
    </div>
  );
}
