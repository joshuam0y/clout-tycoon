import './Notifications.css';

export const Notifications = ({ notifications }) => {
  return (
    <div className="notifications">
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
