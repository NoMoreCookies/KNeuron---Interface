/**
 * Pages owned directly by the KNeuron Shell.
 */
export type ShellPage = "dashboard" | "device" | "settings";

/**
 * Application-level route.
 *
 * Shell pages and module screens are deliberately represented separately.
 */
export type AppRoute =
  | {
      kind: "shell";
      page: ShellPage;
    }
  | {
      kind: "module";
      moduleId: string;
    };
