import './Notifications.css';

export const Notifications = ({ notifications }) => {
  return (
    <div
      className="notifications"
      role="status"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Game notifications"
    >
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification ${notification.type}`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};
