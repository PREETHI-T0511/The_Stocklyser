
import './login.css';
import  { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';



import './style.css';
import { Link } from 'react-router-dom';
function Login_page(){
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/login', {
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("userEmail", res.data.email);

      
      alert(res.data.message); 
      navigate('/');  
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

    return(
        <div>
           <div id="loginHeader">
            <h3 id="LoginTitle">stockLyser<img id="iconlogo" src="/chart.png" alt="chart"></img></h3>
            <Link to="/" id="home" >Home </Link>
           </div> 
           <div id="loginBody">
           <div id="information">
            <p id="welcome">Welcome back!</p>
            Login to your account using your email and password.
             <br></br>
              Don't have an account?
              <br></br> <Link to="/signUp" id="signUp">Sign UP</Link>
              </div>
          
          <form onSubmit={handleLogin} id="loginForm">
          <fieldset id="fieldset"> 
          <label htmlFor="email" id="emailLabel" >Email:</label>
          <br></br>
          
          <input required type="email" id="email" onChange={handleChange} name="email" placeholder="Enter your Email ID" />
          <br></br>
          <br></br>
          <label htmlFor="password" id="passLabel" >Password</label>
          <br></br>
        
        
          <input required type="password"  onChange={handleChange} name="password" id="password" placeholder="Enter your Password"/>
           <br></br>
           <br></br>
          <button  id="login_button"  type="submit" ><img id="loginimg" src="/login.png"></img>LOGIN</button>
          </fieldset> 
          </form>
          </div>
          
        </div>
    );
}
export default Login_page;
