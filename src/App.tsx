import { Component, lazy, Suspense, useState, type CSSProperties, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import AirReadout from './ui/AirReadout';
import { FEATURES, SHOW_SETTINGS } from './config/features';
import BuildMenu from './ui/BuildMenu';
import About from './ui/About';
import CameraControls from './ui/CameraControls';
import Dock from './ui/Dock';
import HeatLegend from './ui/HeatLegend';
import Onboarding from './ui/onboarding/Onboarding';
import Panel from './ui/Panel';
import SimControls from './ui/SimControls';
import ThemeToggle from './ui/ThemeToggle';
import Settings from './ui/Settings';
import { DebugDisplay } from './ui/DebugOverlay';
import { useT } from './i18n';

const Stage = lazy(() => import('./scene/Stage'));

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function NoScene({ text }: { text: string }) {
  return <div className="nogl">{text}</div>;
}

class StageBoundary extends Component<{ children: ReactNode; onFail: () => void; failText: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    console.error(e);
    this.props.onFail();
  }
  render() {
    return this.state.failed ? <NoScene text={this.props.failText} /> : this.props.children;
  }
}

const gl = hasWebGL();

const PANEL_KEY = 'panelWidth';
// The panel never gets narrower than its default width (440 px, 380 px on mid-size screens); dragging only widens it.
const panelMin = () => (window.innerWidth <= 1100 ? 380 : 440);
const panelMax = () => Math.max(panelMin(), Math.min(900, Math.round(window.innerWidth * 0.7)));
const clampPanel = (w: number) => Math.min(panelMax(), Math.max(panelMin(), Math.round(w)));

function readPanelWidth(): number | null {
  try {
    const v = Number(localStorage.getItem(PANEL_KEY));
    return v > 0 ? clampPanel(v) : null;
  } catch {
    return null;
  }
}
function savePanelWidth(w: number | null) {
  try {
    if (w === null) localStorage.removeItem(PANEL_KEY);
    else localStorage.setItem(PANEL_KEY, String(w));
  } catch {
    /* storage unavailable */
  }
}

export default function App() {
  const t = useT();
  const [failure, setFailure] = useState<'webgl' | 'render' | null>(gl ? null : 'webgl');
  const [panelW, setPanelW] = useState<number | null>(readPanelWidth);
  const [dragging, setDragging] = useState(false);
  const shown = panelW ?? panelMin();
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (dragging) setPanelW(clampPanel(window.innerWidth - e.clientX));
  };
  const onUp = () => {
    setDragging(false);
    savePanelWidth(panelW);
  };
  const onKey = (e: RKeyboardEvent<HTMLDivElement>) => {
    const d = e.key === 'ArrowLeft' ? 24 : e.key === 'ArrowRight' ? -24 : 0;
    if (!d) return;
    e.preventDefault();
    const w = clampPanel(shown + d);
    setPanelW(w);
    savePanelWidth(w);
  };
  return (
    <div className={'app' + (dragging ? ' resizing' : '')} style={panelW ? ({ '--panel-w': panelW + 'px' } as CSSProperties) : undefined}>
      <div className="stage" id="stage">
        {failure === 'webgl' ? (
          <NoScene text={t('panel.app.noWebgl')} />
        ) : (
          <StageBoundary onFail={() => setFailure('render')} failText={t('panel.app.renderFail')}>
            <Suspense fallback={<NoScene text={t('panel.app.loading')} />}>
              <Stage />
            </Suspense>
          </StageBoundary>
        )}
        <div className="ruler-x" aria-hidden="true"></div>
        <div className="ruler-y" aria-hidden="true"></div>
        <div className="hud">
          <h1>
            <span className="logo" aria-hidden="true"></span>PC Digital Twin Lab
          </h1>
          {failure === null && FEATURES.simControls ? <SimControls /> : null}
        </div>
        <div className="bar">
          <div className="bar-r">
            {FEATURES.buildMenu ? <BuildMenu /> : null}
            {SHOW_SETTINGS ? <Settings /> : null}
            {FEATURES.aboutButton ? <About /> : null}
            {FEATURES.themeToggle ? <ThemeToggle /> : null}
          </div>
        </div>
        {failure === null ? (
          <>
            {FEATURES.cameraControls ? <CameraControls /> : null}
            {FEATURES.airflow ? <AirReadout /> : null}
            {FEATURES.heatmap ? <HeatLegend /> : null}
            <Dock />
          </>
        ) : null}
      </div>
      <div
        className="resizer" role="separator" aria-orientation="vertical" aria-label={t('panel.app.resize')} aria-valuemin={panelMin()} aria-valuemax={panelMax()} aria-valuenow={shown}
        tabIndex={0} title={t('panel.app.resizeHint')} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}
        onDoubleClick={() => { setPanelW(null); savePanelWidth(null); }}
      />
      <aside className="panel" id="panel">
        <Panel />
      </aside>
      {FEATURES.onboarding ? <Onboarding /> : null}
      <DebugDisplay />
    </div>
  );
}
