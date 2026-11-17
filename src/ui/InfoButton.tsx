import { useState, type ReactNode } from 'react';
import { MdInfoOutline } from 'react-icons/md';
import { useT } from '../i18n';
import Modal from './Modal';

interface InfoButtonProps {
  /** Accessible name of the (i) button. */
  label: string;
  /** Heading of the explanation dialog. */
  title: string;
  /** Dialog body; `<p className="modal-lead">` and `<section className="modal-section">` give the modal layout. */
  children: ReactNode;
}

/** A small (i) button that opens an explanation in a modal. */
export default function InfoButton({ label, title, children }: InfoButtonProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="info-btn" aria-label={label} title={label} onClick={() => setOpen(true)}>
        <MdInfoOutline size={16} aria-hidden="true" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} icon={<MdInfoOutline size={16} />} closeLabel={t('panel.about.close')} className="info-modal">
        {children}
      </Modal>
    </>
  );
}
