
import './terms.css';
import {  Link } from "react-router-dom";
 export default function Terms(){
     return(
     <div>
        <div id="termsHeader">
            <h3 id="LoginTitle">stockLyser<img id="iconlogo" src="/chart.png" alt="chart"></img></h3>
            <Link to="/" id="home" >Home </Link>
        </div> 
        <div id="termsBody">
            <div id="content">
                <div id="div1"><h1>Welcome to Stocklyser.</h1>
              Thanks for using our products and services ("Services"). 

                 By using our Services, you are agreeing to these terms. Please read them carefully.
                 </div>
            
                <div id="div2"><h1>Terms</h1>
                 By accessing the Site, you are agreeing to be bound by our terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any
                of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.
               </div>
               <div id="div3"><h1>Contact Us</h1>
                 <div id="details"> 
                      <p>Name:Pooja R<br></br>Contact:9629817770</p>
                      <p>Name:Priyanka M<br></br>Contact:8660105563</p>
                     <p>Name:Priyanka N<br></br>Contact:9538805532</p>
                      
                 </div>
            </div>
            </div>
        </div>
    </div>
              );
}