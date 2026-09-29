export type NotificationType = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: string;

  type: NotificationType;

  title: string;

  message?: string;
}

export interface CreateNotification {
  type: NotificationType;

  title: string;

  message?: string;

  /**
   * Automatic dismissal delay.
   *
   * Set to 0 to keep the notification visible
   * until the user closes it manually.
   */
  durationMs?: number;
}
