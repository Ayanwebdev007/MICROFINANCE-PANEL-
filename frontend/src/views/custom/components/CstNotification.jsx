import React from "react";
import NotificationAlert from "react-notification-alert";

function CstNotification({color, message, autoDismiss, place, timestamp}) {
  React.useEffect(() => {
    notify();
  }, [message, timestamp]);

  const notify = () => {
    const options = {
      place: place,
      message: (
        <div>
          <div>
            <strong>{color.toUpperCase()}</strong>
            <div>{message}</div>
          </div>
        </div>
      ),
      type: color,
      icon: "tim-icons icon-bell-55",
      autoDismiss: autoDismiss,
    };
    notificationAlertRef.current.notificationAlert(options);
  };
  const notificationAlertRef = React.useRef(null);
  return (
    <>
      <div className="rna-container">
        <NotificationAlert ref={notificationAlertRef} />
      </div>
    </>
  )
}

export default CstNotification;