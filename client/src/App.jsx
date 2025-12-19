import { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/auth/current_user', {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (data && data._id) {
                    setUser(data);
                } else {
                    setUser(null);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching current user:', err);
                setLoading(false);
            });
    }, []);

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
            <Dashboard user={user} />
        </div>
    );
}

export default App;
