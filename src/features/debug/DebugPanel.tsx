import { Trash2 } from "lucide-react";

import { logger } from "../../lib/logger";

import { useDebugLog } from "./useDebugLog";

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour12: false,
  });
}

export function DebugPanel() {
  const entries = useDebugLog();

  return (
    <aside className="debug-panel">
      <header className="debug-panel__header">
        <div>
          <strong>Debug log</strong>

          <span>{entries.length} entries</span>
        </div>

        <button
          type="button"
          aria-label="Clear debug log"
          onClick={() => {
            logger.clear();
          }}
        >
          <Trash2 size={15} />
        </button>
      </header>

      <div className="debug-panel__entries">
        {entries.length === 0 ? (
          <div className="debug-panel__empty">No log entries.</div>
        ) : (
          entries
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry.id} className={`debug-entry debug-entry--${entry.level}`}>
                <span className="debug-entry__time">{formatTime(entry.timestamp)}</span>

                <span className="debug-entry__source">{entry.source}</span>

                <span className="debug-entry__message">{entry.message}</span>
              </div>
            ))
        )}
      </div>
    </aside>
  );
}
