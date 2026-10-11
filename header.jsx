
import {  Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import  { useState,useEffect } from 'react';

function Header() {
   const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const status = localStorage.getItem("isLoggedIn") === "true";
    const email = localStorage.getItem("userEmail") || '';
    setIsLoggedIn(status);
    setUserEmail(email);
  }, []);


 function handleLogout(e){
    e.preventDefault();
     localStorage.setItem("isLoggedIn",false);
    localStorage.removeItem("userEmail"); // optional
    setIsLoggedIn(true);

    
    alert("Logged Out Successfully!!");
    navigate('/');
    return;
 }
  return (
    <div id="header">
      <Link to="/" id="home">Home</Link>
      {isLoggedIn===false? (
        <a href="/" id="login_link" style={{ width: "200px" }} onClick={handleLogout}>
          <img id="loginimg" src="/login.png" alt="logout" />LOGOUT
        </a>
      ) : (
        <Link to="/login" id="login_link">
          <img id="loginimg" src="/login.png" alt="login" />LOGIN
        </Link>
      )}

    </div>
  );
}
export default Header;
