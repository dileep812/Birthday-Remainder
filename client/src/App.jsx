import { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Landing from './components/Landing';

function App() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    dateOfEvent: '',
    eventType: 'Birthday',
    notes: '',
    isRecurring: true
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch current user
  useEffect(() => {
    console.log('Fetching current user from Render backend...');
    fetch('https://birthday-remainder-zodg.onrender.com/auth/current_user', {
      credentials: 'include',
      mode: 'cors'
    })
      .then(res => {
        console.log('Response status:', res.status);
        console.log('Response headers:', [...res.headers.entries()]);
        return res.json();
      })
      .then(data => {
        console.log('Current user data received:', data);
        console.log('Data type:', typeof data);
        console.log('Is null?:', data === null);
        if (data && data._id) {
          console.log('User authenticated! Setting user...');
          setUser(data);
        } else {
          console.log('No valid user data, showing landing page');
          setUser(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching current user:', err);
        setLoading(false);
      });
  }, []);

  // Fetch events when user is logged in
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('https://birthday-remainder-zodg.onrender.com/api/events', {
        credentials: 'include'
      });
      const data = await res.json();
      console.log('Events Data:', data);
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingId
      ? `https://birthday-remainder-zodg.onrender.com/api/events/${editingId}`
      : 'https://birthday-remainder-zodg.onrender.com/api/events';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: formData.dateOfEvent  // Map to backend field
        }),
        credentials: 'include'
      });

      if (res.ok) {
        fetchEvents();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleEdit = (event) => {
    const dateValue = event.date || event.dateOfEvent;
    setFormData({
      name: event.name,
      dateOfEvent: dateValue ? dateValue.split('T')[0] : '',
      eventType: event.eventType,
      notes: event.notes || '',
      isRecurring: event.isRecurring
    });
    setEditingId(event._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const res = await fetch(`https://birthday-remainder-zodg.onrender.com/api/events/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dateOfEvent: '',
      eventType: 'Birthday',
      notes: '',
      isRecurring: true
    });
    setEditingId(null);
  };

  const getEventEmoji = (type) => {
    switch (type) {
      case 'Birthday': return '🎂';
      case 'Anniversary': return '💍';
      case 'Festival': return '🎉';
      default: return '📅';
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        <Header user={null} />
        <Landing />
      </div>
    );
  }

  return (
    <div className="app">
      <Header user={user} />

      <main className="main">
        <div className="dashboard-header">
          <h2 className="welcome">Welcome back, {user.displayName}! 👋</h2>
        </div>

        <div className="dashboard-content">
          <section className="form-section">
            <form className="event-form" onSubmit={handleSubmit}>
              <h3>{editingId ? 'Edit Event' : 'Add New Event'}</h3>

              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
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
                    onChange={handleInputChange}
                  />
                  <span>Recurring Event (repeats yearly)</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update Event' : 'Add Event'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="list-section">
            <h3>Your Events ({events.length})</h3>

            {events.length === 0 ? (
              <div className="empty-state">
                <p>No events yet. Add your first event!</p>
              </div>
            ) : (
              <div className="events-grid">
                {events.map(event => (
                  <div key={event._id} className="event-card">
                    <div className="event-emoji">{getEventEmoji(event.eventType)}</div>
                    <div className="event-info">
                      <h4>{event.name}</h4>
                      <p className="event-date">
                        {new Date(event.date || event.dateOfEvent).toLocaleDateString('en-US', {
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
                      <button className="btn-icon" onClick={() => handleEdit(event)} title="Edit">
                        ✏️
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => handleDelete(event._id)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
