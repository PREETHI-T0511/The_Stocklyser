import React,{useState} from 'react';

import axios from "axios";
import './login.css';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'; 
import './style.css';



function SignUp_page(){
    const [formData,setFormData]=useState({
        email:"",
        password:"",
        confirmPass:""

    })
    const handleChange=(e)=>{
      setFormData({...formData,[e.target.name]:e.target.value});
    }
    const handleFormSubmit=async(e)=>{
      e.preventDefault();
      if (formData.password !== formData.confirmPass) {
       alert("Passwords do not match!");
      

  return;}
      try{
        


      const res=await axios.post('http://localhost:5000/signUp', {
      email: formData.email,
      password: formData.password,
    });


        alert(res.data.message);
        window.location.reload();
      }catch (err) {
        console.error(err);
        alert("Error: " + (err.response?.data?.error || err.message));
}

      
    };
    return(
        <div>
           <div id="loginHeader">
            <h3 id="LoginTitle">stockLyser<img id="iconlogo" src="/chart.png" alt="chart"></img></h3>
            <Link to ="/" id='home'>Home</Link>
           </div> 
           <div id="signUpBody">
           <div id="information">
            <p id="welcome">Get a Free Account!</p>
            By registering you agree to the <a>Terms of Use</a>.
             <br></br>
             <br></br>
              Created  an account?
              <br></br> <Link to="/login" id="signUp">Login</Link>
              </div>
          
          <form onSubmit={handleFormSubmit} id="loginForm">
          <fieldset id="fieldset"> 
          <label htmlFor="email" id="emailLabel" >Email:</label>
          <br></br>
          
          <input required type="email" name="email" id="email" placeholder="Enter your Email ID" onChange={handleChange} />
          <br></br>
          <br></br>
          <label htmlFor="password" id="passLabel" >Password</label>
          <br></br>
        
        
          <input required type="password" name="password" id="password"  onChange={handleChange} placeholder="Enter your Password"/>
           <br></br>
           <br></br>
           <label htmlFor="reEnter_password" id="label_reEnter_passLabel" >ReEnter Password</label>
             <br></br>
        
        
          <input required type="password"  name="confirmPass" onChange={handleChange}  id="reEnter_password" placeholder="Enter your Password Again"/>
           <br></br>
           <br></br>
        <button  id="login_button" type="submit"  ><img id="loginimg" src="/login.png"></img>SIGN UP</button>
          </fieldset> 
          </form>
          </div>
          
        </div>
    );
}
export default SignUp_page;
