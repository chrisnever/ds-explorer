"use client";

import { useEffect, useRef, useState } from "react";
import type { ArgValue, Args, Field } from "./blocks";

// The build panel's form: one control per editable arg of a component's
// story. Shared by draft blocks and a component's own page.

const inputClass =
  "w-full rounded-lg bg-[var(--bar-thumb)] px-2.5 py-1.5 text-[13px] outline-none ring-[var(--bar-fg)] focus:ring-[1.5px]";

// Logos and avatars show at 48pt, so 256px covers 3× screens with room to
// spare while keeping a data URL small enough for localStorage.
const IMAGE_MAX_PX = 256;

/** A dropped or chosen image, scaled down to fit and encoded as a data URL. */
async function imageToDataUrl(file: File): Promise<string> {
  const asIs = () =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  // Vectors scale on their own, and some browsers can't rasterise them here.
  if (file.type === "image/svg+xml") return asIs();
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, IMAGE_MAX_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // PNG keeps logos' transparency.
  return canvas.toDataURL("image/png");
}

export function ArgsEditor({
  fields,
  values,
  onChange,
  focus,
  onEscape,
}: {
  fields: Field[];
  values: Args;
  onChange: (key: string, value: ArgValue) => void;
  /** The field to focus; `n` bumps so asking for the same field again refocuses it. */
  focus?: { key: string; n: number } | null;
  onEscape?: () => void;
}) {
  const inputs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const el = focus && inputs.current[focus.key];
    if (!el) return;
    el.focus();
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.select();
  }, [focus]);

  const bind = (key: string) => (el: HTMLElement | null) => {
    inputs.current[key] = el;
  };

  return (
    <div className="flex flex-col gap-3">
      {fields.map((f) => {
        const value = values[f.key];
        const text = typeof value === "string" ? value : "";
        return (
          <div key={f.key} className="flex flex-col gap-1">
            {f.kind === "boolean" ? (
              <label className="flex items-center justify-between gap-3 px-1">
                <span className="text-[12.5px]">{f.label}</span>
                <input
                  ref={bind(f.key)}
                  type="checkbox"
                  role="switch"
                  checked={value === true}
                  onChange={(e) => onChange(f.key, e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-5 w-9 shrink-0 rounded-full bg-[var(--bar-thumb)] shadow-[inset_0_0_0_1px_var(--bar-ring)] transition-colors peer-checked:bg-accent peer-focus-visible:ring-[1.5px] peer-focus-visible:ring-[var(--bar-fg)] after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
                />
              </label>
            ) : (
              <>
                <span className="px-1 text-[11.5px] font-medium text-[var(--bar-muted)]">{f.label}</span>
                {f.kind === "select" ? (
                  <div className="relative">
                    <select
                      ref={bind(f.key)}
                      value={text}
                      onChange={(e) => onChange(f.key, e.target.value)}
                      aria-label={f.label}
                      className={`${inputClass} appearance-none pr-7`}
                    >
                      <option value="">None</option>
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o[0].toUpperCase() + o.slice(1)}
                        </option>
                      ))}
                    </select>
                    <svg
                      aria-hidden
                      viewBox="0 0 10 6"
                      className="pointer-events-none absolute right-2.5 top-1/2 w-2.5 -translate-y-1/2 text-[var(--bar-muted)]"
                    >
                      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                ) : f.kind === "image" ? (
                  <ImageField
                    ref={bind(f.key)}
                    label={f.label}
                    value={text}
                    onChange={(v) => onChange(f.key, v)}
                  />
                ) : f.kind === "multiline" ? (
                  <textarea
                    ref={bind(f.key)}
                    rows={4}
                    value={text}
                    aria-label={f.label}
                    onChange={(e) => onChange(f.key, e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && onEscape?.()}
                    className={`${inputClass} resize-none leading-snug`}
                  />
                ) : (
                  <input
                    ref={bind(f.key)}
                    value={text}
                    aria-label={f.label}
                    onChange={(e) => onChange(f.key, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") onEscape?.();
                    }}
                    className={inputClass}
                  />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** A drop zone that also opens the file picker; empty means the story's own image. */
function ImageField({
  ref,
  label,
  value,
  onChange,
}: {
  ref: (el: HTMLElement | null) => void;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const take = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("That file isn’t an image.");
    try {
      setError(null);
      onChange(await imageToDataUrl(file));
    } catch {
      setError("Couldn’t read that image.");
    }
  };

  const hasFiles = (e: React.DragEvent) => e.dataTransfer.types.includes("Files");

  return (
    <div className="flex flex-col gap-1.5">
      <button
        ref={ref}
        type="button"
        aria-label={`${label}: drop an image or click to choose one`}
        onClick={() => picker.current?.click()}
        onDragOver={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files[0]);
        }}
        className={`flex items-center gap-3 rounded-lg border-[1.5px] border-dashed p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-[var(--bar-fg)] ${
          over ? "border-accent bg-accent/5" : "border-[var(--bar-ring)] hover:border-[var(--bar-muted)]"
        }`}
      >
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-[var(--bar-thumb)] text-[10.5px] text-[var(--bar-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- a data URL preview, nothing to optimise */}
          {value ? <img src={value} alt="" className="size-full object-cover" /> : "Default"}
        </span>
        <span className="text-[12px] leading-snug text-[var(--bar-muted)]">
          {over ? "Drop to use this image" : value ? "Drop or click to replace" : "Drop an image, or click to choose"}
        </span>
      </button>
      <input
        ref={picker}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && <p className="px-1 text-[11.5px] text-[#c9352b]">{error}</p>}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="self-start rounded-md px-1 text-[11.5px] text-[var(--bar-muted)] hover:text-[var(--bar-fg)]"
        >
          Use the default image
        </button>
      )}
    </div>
  );
}
