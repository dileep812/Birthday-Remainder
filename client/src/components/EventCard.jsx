import './EventCard.css';

function EventCard({ event, onDelete }) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="event-card">
      <div className="event-icon">
        {event.eventType === 'Birthday' ? '🎂' : '🎉'}
      </div>
      <div className="event-details">
        <h3 className="event-name">{event.name}</h3>
        <p className="event-date">{formatDate(event.dateOfEvent)}</p>
        <span className={`event-type type-${event.eventType.toLowerCase()}`}>
          {event.eventType}
        </span>
      </div>
      <div className="event-actions">
        <button onClick={() => onDelete(event._id)} className="btn-delete">
          Delete
        </button>
      </div>
    </div>
  );
}

export default EventCard;
