import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MdClose } from 'react-icons/md';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Heading text, also the accessible name of the dialog. */
  title: string;
  icon?: ReactNode;
  closeLabel: string;
  /** Extra class on the dialog, for per-modal sizing. */
  className?: string;
  children: ReactNode;
}

let nextId = 0;

/** Blurred-scrim dialog: portal, inert page behind, focus trap, Esc and click-outside to close, focus restored on close. */
export default function Modal({ open, onClose, title, icon, closeLabel, className, children }: ModalProps) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useRef(`modal-title-${nextId++}`).current;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    close.current?.focus();
    // The rest of the page is inert while the dialog is open: no clicks, keys, scrolling or screen-reader access behind it.
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog.current) return;
      const f = dialog.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), select, input:not([disabled])');
      if (!f.length) return;
      const first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // Native listener, so it does not depend on React's portal event handling.
    const onDown = (e: PointerEvent) => {
      if (dialog.current && e.target instanceof Node && !dialog.current.contains(e.target)) onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
      root?.removeAttribute('inert');
      opener?.focus();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="modal-scrim">
      <div className={className ? `modal ${className}` : 'modal'} ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button ref={close} type="button" className="modal-x" aria-label={closeLabel} onClick={onClose}>
          <MdClose size={16} />
        </button>
        <div className="modal-header">
          {icon}
          <h2 id={titleId}>{title}</h2>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
