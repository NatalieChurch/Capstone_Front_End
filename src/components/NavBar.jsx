import { Link, useNavigate } from 'react-router-dom';


function NavBar({token, setToken}){
    const navigate = useNavigate();
    const handleLogout = () =>{
        setToken(null);
        localStorage.removeItem('token');
        navigate("/");
    }

    return(
    <div>
        <nav>
            <h1> Blackjack </h1>
            <div>
                <Link to="/">Home</Link>
                {token ? (
                    <>
                    <Link to="/account">Account</Link>
                    <Link to="/game">Game</Link>
                    <button onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    </div>
    )
}

export default NavBar