import { useApp, type CamCmd } from '../state/store';
import { useT, type MessageKey } from '../i18n';
import { MdZoomIn, MdZoomOut, MdRotate90DegreesCcw, MdRotate90DegreesCw } from 'react-icons/md';

const BTNS: { kind: CamCmd; label: MessageKey; icon: React.ReactNode }[] = [
  { kind: 'zoomIn', label: 'power.camera.zoomIn', icon: <MdZoomIn size={20} /> },
  { kind: 'zoomOut', label: 'power.camera.zoomOut', icon: <MdZoomOut size={20} /> },
  { kind: 'rotL', label: 'power.camera.rotL', icon: <MdRotate90DegreesCcw size={20} /> },
  { kind: 'rotR', label: 'power.camera.rotR', icon: <MdRotate90DegreesCw size={20} /> }
];

export default function CameraControls() {
  const t = useT();
  const sendCam = useApp((s) => s.sendCam);
  return (
    <div className="camctl surf" role="group" aria-label={t('power.camera.aria')}>
      {BTNS.map((b) => (
        <button key={b.kind} type="button" id={'cam-' + b.kind} aria-label={t(b.label)} title={t(b.label)} onClick={() => sendCam(b.kind)}>
          {b.icon}
        </button>
      ))}
    </div>
  );
}
