import { CheckCircle2, CircleX, Info, TriangleAlert, X } from "lucide-react";

import { notificationStore } from "../../lib/notificationStore";

import { useNotifications } from "./useNotifications";

import type { NotificationType } from "../../types/notification";

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "success":
      return <CheckCircle2 size={17} />;

    case "warning":
      return <TriangleAlert size={17} />;

    case "error":
      return <CircleX size={17} />;

    case "info":
    default:
      return <Info size={17} />;
  }
}

export function NotificationCenter() {
  const notifications = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-center" aria-live="polite">
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className={`notification notification--${notification.type}`}
        >
          <div className="notification__icon">
            <NotificationIcon type={notification.type} />
          </div>

          <div className="notification__content">
            <strong>{notification.title}</strong>

            {notification.message && <span>{notification.message}</span>}
          </div>

          <button
            type="button"
            className="notification__close"
            aria-label="Close notification"
            onClick={() => {
              notificationStore.remove(notification.id);
            }}
          >
            <X size={15} />
          </button>
        </article>
      ))}
    </div>
  );
}
