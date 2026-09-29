import { Settings } from 'lucide-react';

export function DevicePanel() {
  return <aside className="device-panel">
    <div className="panel-title"><h2>Device</h2><Settings size={20}/></div>
    <div className="device-empty">
      <div className="device-orbit"><span/></div>
      <h3>No EEG device connected</h3>
      <p>The shell is ready for a future KNeuron device adapter.</p>
      <button className="secondary-button" disabled>Connect device</button>
    </div>
  </aside>;
}
