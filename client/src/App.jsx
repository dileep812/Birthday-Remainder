import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/auth/current_user')
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Birthday Reminder</h1>
        {user ? (
          <span>Welcome, {user.displayName}</span>
        ) : (
          <a href="/auth/google">Login with Google</a>
        )}
      </header>
      <main>
        <p>Your events will appear here</p>
      </main>
    </div>
  );
}

export default App;
