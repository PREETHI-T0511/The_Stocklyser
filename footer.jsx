
import {  Link } from "react-router-dom";

 export default function Footer(){
    return(
        <div id="footer">
            <div id="desc"><h5>stockLyser</h5>
            <h6>Stock analysis and screening tool</h6>
           <Link to="/terms" id='copyright'>Terms&Conditions</Link>
            </div>
            
               
               <Link to="/aboutUs" id='team'>About US</Link>
                <div id="Theme ">  
                <div><ul id="themeList" >
                    <caption style={{cursor:"default"}}>Theme:</caption>
                    <li id="light">Light</li>
                    
                    
                </ul>
                </div>
            
            </div>
        </div>
    )
}
