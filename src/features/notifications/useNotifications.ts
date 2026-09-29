import { useEffect, useState } from "react";

import { notificationStore } from "../../lib/notificationStore";

import type { AppNotification } from "../../types/notification";

export function useNotifications(): AppNotification[] {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    notificationStore.getAll(),
  );

  useEffect(() => {
    return notificationStore.subscribe((nextNotifications) => {
      setNotifications([...nextNotifications]);
    });
  }, []);

  return notifications;
}
