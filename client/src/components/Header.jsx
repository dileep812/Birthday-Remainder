import './Header.css';

function Header({ user }) {
    return (
        <header className="header">
            <div className="header-content">
                <div className="logo">
                    <span className="logo-icon">🎂</span>
                    <span className="logo-text">Birthday Reminder</span>
                </div>
                <nav className="nav">
                    {user ? (
                        <div className="user-menu">
                            <img src={user.image} alt={user.displayName} className="user-avatar" />
                            <span>{user.displayName}</span>
                            <a href="https://birthday-remainder-zodg.onrender.com/auth/logout" className="btn-logout">Logout</a>
                        </div>
                    ) : (
                        <a href="https://birthday-remainder-zodg.onrender.com/auth/google" className="btn-login">Login with Google</a>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Header;
