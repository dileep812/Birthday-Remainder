import { useState, useEffect } from 'react';
import EventForm from './EventForm';
import EventList from './EventList';

function Dashboard({ user }) {
    const [events, setEvents] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        dateOfEvent: '',
        eventType: 'Birthday',
        notes: '',
        isRecurring: true
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/events', {
                credentials: 'include'
            });
            const data = await res.json();
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
            ? `/api/events/${editingId}`
            : '/api/events';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
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
        const dateValue = event.dateOfEvent;
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
            const res = await fetch(`/api/events/${id}`, {
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

    return (
        <main className="main">
            <div className="dashboard-header">
                <h2 className="welcome">Welcome back, {user.displayName}! 👋</h2>
            </div>

            <div className="dashboard-content">
                <section className="form-section">
                    <EventForm
                        formData={formData}
                        onChange={handleInputChange}
                        onSubmit={handleSubmit}
                        onCancel={resetForm}
                        editingId={editingId}
                    />
                </section>

                <EventList
                    events={events}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </main>
    );
}

export default Dashboard;
