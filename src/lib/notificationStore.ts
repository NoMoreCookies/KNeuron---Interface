import type { AppNotification, CreateNotification } from "../types/notification";

type NotificationListener = (notifications: readonly AppNotification[]) => void;

class NotificationStore {
  private notifications: AppNotification[] = [];

  private readonly listeners = new Set<NotificationListener>();

  private nextId = 1;

  getAll(): AppNotification[] {
    return [...this.notifications];
  }

  add(notification: CreateNotification): string {
    const id = `notification-${Date.now()}-${this.nextId++}`;

    const nextNotification: AppNotification = {
      id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
    };

    this.notifications = [...this.notifications, nextNotification];

    this.emit();

    const duration = notification.durationMs ?? 4000;

    if (duration > 0) {
      window.setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  remove(notificationId: string): void {
    const nextNotifications = this.notifications.filter(
      (notification) => notification.id !== notificationId,
    );

    if (nextNotifications.length === this.notifications.length) {
      return;
    }

    this.notifications = nextNotifications;

    this.emit();
  }

  clear(): void {
    this.notifications = [];

    this.emit();
  }

  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snapshot = this.getAll();

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const notificationStore = new NotificationStore();
