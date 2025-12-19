function EventCard({ event, onEdit, onDelete }) {
  const getEventEmoji = (type) => {
    switch (type) {
      case 'Birthday': return '🎂';
      case 'Anniversary': return '💍';
      case 'Festival': return '🎉';
      default: return '📅';
    }
  };

  return (
    <div className="event-card">
      <div className="event-emoji">{getEventEmoji(event.eventType)}</div>
      <div className="event-info">
        <h4>{event.name}</h4>
        <p className="event-date">
          {new Date(event.dateOfEvent).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <span className={`event-type-badge type-${event.eventType.toLowerCase()}`}>
          {event.eventType}
        </span>
        {event.notes && <p className="event-notes">{event.notes}</p>}
        {event.isRecurring && <span className="recurring-badge">🔄 Recurring</span>}
      </div>
      <div className="event-actions">
        <button className="btn-icon" onClick={() => onEdit(event)} title="Edit">
          ✏️
        </button>
        <button className="btn-icon btn-delete" onClick={() => onDelete(event._id)} title="Delete">
          🗑️
        </button>
      </div>
    </div>
  );
}

export default EventCard;
