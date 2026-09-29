import {
  useEffect,
  useState,
} from "react";

import { moduleRegistry } from "../../lib/moduleRegistry";

import type { RegisteredModule } from "../../types/module";

/**
 * React adapter for ModuleRegistry.
 *
 * ModuleRegistry itself intentionally contains no React code.
 * This hook translates registry change notifications into React state updates.
 */
export function useRegisteredModules(): RegisteredModule[] {
  const [modules, setModules] = useState<RegisteredModule[]>(
    () => moduleRegistry.getAll(),
  );

  useEffect(() => {
    const unsubscribe = moduleRegistry.subscribe(() => {
      setModules(
        moduleRegistry.getAll(),
      );
    });

    return unsubscribe;
  }, []);

  return modules;
}