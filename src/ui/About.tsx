import { useState } from 'react';
import { MdInfo } from 'react-icons/md';
import { useT } from '../i18n';
import Modal from './Modal';

const AUTHOR = 'Osvaldo Margato';
const GITHUB = 'https://github.com/margato';
const AVATAR = 'https://github.com/margato.png?size=160';

export default function About() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [noAvatar, setNoAvatar] = useState(false);
  return (
    <>
      <button type="button" className="aboutbtn surf" id="aboutBtn" onClick={() => setOpen(true)}>
        <MdInfo size={16} />
        {t('panel.about.button')}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="PC Digital Twin Lab" icon={<MdInfo size={16} />} closeLabel={t('panel.about.close')} className="about-modal">
        <p className="modal-lead">{t('panel.about.intro')}</p>
        <section className="modal-section">
          <h3>{t('panel.about.howTitle')}</h3>
          <ul>
            <li>{t('panel.about.howDrag')}</li>
            <li>{t('panel.about.howButtons')}</li>
            <li>{t('panel.about.howScale')}</li>
          </ul>
        </section>
        <section className="modal-section">
          <h3>{t('panel.about.goodTitle')}</h3>
          <p>{t('panel.about.goodText')}</p>
        </section>
        <section className="modal-section">
          <h3>{t('panel.about.creditsTitle')}</h3>
          <a className="author" href={GITHUB} target="_blank" rel="noopener noreferrer">
            {noAvatar ? (
              <span className="avatar fallback" aria-hidden="true">{AUTHOR[0]}</span>
            ) : (
              <img className="avatar" src={AVATAR} alt="" width={48} height={48} onError={() => setNoAvatar(true)} />
            )}
            <span>
              <b>{AUTHOR}</b>
              <small>github.com/margato</small>
            </span>
          </a>
        </section>
      </Modal>
    </>
  );
}
