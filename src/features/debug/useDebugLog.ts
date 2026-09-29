import { useEffect, useState } from "react";

import { logger } from "../../lib/logger";

import type { LogEntry } from "../../types/logging";

export function useDebugLog(): LogEntry[] {
  const [entries, setEntries] = useState<LogEntry[]>(() => logger.getEntries());

  useEffect(() => {
    return logger.subscribe((nextEntries) => {
      setEntries([...nextEntries]);
    });
  }, []);

  return entries;
}
