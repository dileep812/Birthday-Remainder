import EventCard from './EventCard';

function EventList({ events, onEdit, onDelete }) {
    return (
        <section className="list-section">
            <h3>Your Events ({events.length})</h3>

            {events.length === 0 ? (
                <div className="empty-state">
                    <p>No events yet. Add your first event!</p>
                </div>
            ) : (
                <div className="events-grid">
                    {events.map(event => (
                        <EventCard
                            key={event._id}
                            event={event}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

export default EventList;
