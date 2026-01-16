function EventForm({ formData, onChange, onSubmit, onCancel, editingId }) {
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate non-recurring events have future dates
        if (!formData.isRecurring) {
            const selectedDate = new Date(formData.dateOfEvent);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                alert('⚠️ Non-recurring events must have future dates. Please enter a date that is today or later.');
                return;
            }
        }

        onSubmit(e);
    };

    return (
        <form className="event-form" onSubmit={handleSubmit}>
            <h3>{editingId ? 'Edit Event' : 'Add New Event'}</h3>

            <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    placeholder="Enter name"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="eventType">Event Type</label>
                <select
                    id="eventType"
                    name="eventType"
                    value={formData.eventType}
                    onChange={onChange}
                >
                    <option value="Birthday">🎂 Birthday</option>
                    <option value="Anniversary">💍 Anniversary</option>
                    <option value="Festival">🎉 Festival</option>
                    <option value="Other">📅 Other</option>
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="dateOfEvent">Date of Event</label>
                <input
                    type="date"
                    id="dateOfEvent"
                    name="dateOfEvent"
                    value={formData.dateOfEvent}
                    onChange={onChange}
                    required
                />
                {!formData.isRecurring && (
                    <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                        💡 Non-recurring events must be set for future dates only
                    </small>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={onChange}
                    placeholder="E.g., Buy flowers, Make reservation..."
                    rows="3"
                />
            </div>

            <div className="form-group checkbox-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        id="isRecurring"
                        name="isRecurring"
                        checked={formData.isRecurring}
                        onChange={onChange}
                    />
                    <span>Recurring Event (repeats yearly)</span>
                </label>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                    {editingId ? 'Update Event' : 'Add Event'}
                </button>
                {editingId && (
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

export default EventForm;
