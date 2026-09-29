import { AppWindow, Cpu, FolderClock, LayoutDashboard, Settings } from 'lucide-react';
import type { ShellPage } from "../types/navigation";
import { APP_CONFIG } from "../config/appConfig";


const items: Array<{ id: ShellPage; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'device', label: 'Device', icon: Cpu },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export function Sidebar({ page, onNavigate }: { page: ShellPage; onNavigate: (page: ShellPage) => void }) {
  return <aside className="sidebar">
    <nav aria-label="Main navigation">
      {items.map(({ id, label, icon: Icon }) => <button key={id} className={page === id ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate(id)}><Icon size={21}/><span>{label}</span></button>)}
    </nav>
    <div className="wave" aria-hidden="true"><svg viewBox="0 0 240 170" preserveAspectRatio="none">{Array.from({length: 13}, (_, i) => <path key={i} d={`M-10 ${72+i*5} C 45 ${25+i*4}, 82 ${145-i*2}, 145 ${91+i*2} S 225 ${58+i*3}, 255 ${95+i*2}`} />)}</svg></div>
    <strong>
      {APP_CONFIG.name} v{APP_CONFIG.version}
    </strong>
    <span>Built for Brain-Computer Interface</span>
  </aside>;
}
