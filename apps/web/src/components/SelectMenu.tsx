import { useEffect, useRef, useState } from 'react';

export type SelectMenuOption = { value: string; label: string };

type SelectMenuProps = {
  id?: string;
  value: string;
  options: readonly SelectMenuOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

export function SelectMenu({
  id,
  value,
  options,
  onChange,
  disabled,
  className,
  'aria-label': ariaLabel,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={`cw-sm${className ? ` ${className}` : ''}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`cw-sm__trigger${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        {selected?.label ?? value}
      </button>
      <div
        className={`cw-sm__menu${open ? ' is-open' : ''}`}
        role="menu"
        aria-hidden={!open}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="menuitem"
            className={opt.value === value ? 'is-selected' : undefined}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
              triggerRef.current?.focus();
            }}
          >
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
