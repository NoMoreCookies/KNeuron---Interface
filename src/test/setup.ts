import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * React Testing Library normally performs automatic cleanup between tests.
 *
 * KNeuron runs Vitest with `globals: false`, so we register cleanup
 * explicitly to guarantee that every test starts with an empty DOM.
 */
afterEach(() => {
  cleanup();
});
