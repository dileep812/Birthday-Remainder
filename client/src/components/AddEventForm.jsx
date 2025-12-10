import { useState } from 'react';
import './AddEventForm.css';

function AddEventForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    dateOfEvent: '',
    eventType: 'Birthday',
    notes: '',
    isRecurring: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      dateOfEvent: '',
      eventType: 'Birthday',
      notes: '',
      isRecurring: true
    });
  };

  return (
    <form className="add-event-form" onSubmit={handleSubmit}>
      <h2>Add New Event</h2>
      
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="dateOfEvent">Date</label>
        <input
          type="date"
          id="dateOfEvent"
          name="dateOfEvent"
          value={formData.dateOfEvent}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="eventType">Event Type</label>
        <select
          id="eventType"
          name="eventType"
          value={formData.eventType}
          onChange={handleChange}
        >
          <option value="Birthday">Birthday</option>
          <option value="Anniversary">Anniversary</option>
          <option value="Festival">Festival</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes (Optional)</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any notes..."
          rows="3"
        />
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="isRecurring"
            checked={formData.isRecurring}
            onChange={handleChange}
          />
          Recurring Event
        </label>
      </div>

      <button type="submit" className="btn-submit">Add Event</button>
    </form>
  );
}

export default AddEventForm;
