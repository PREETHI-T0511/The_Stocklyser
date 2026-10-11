
import './terms.css';
import {  Link } from "react-router-dom";
export default function AboutUs(){
    return(
        <div>
           <div id="AboutUsHeader">
            <h3 id="LoginTitle">stockLyser<img id="iconlogo" src="/chart.png" alt="chart"></img></h3>
            <Link to="/" id="home" >Home </Link>
           </div> 
        
        <div id="AboutUsBody">
            <div id="about_content">
                <h1>
                    About Us
                </h1>
                <div>
                    We are a team of enthusiastic students dedicated to learning, exploring, and applying our knowledge
                     through practical projects. 
                    This mini project was developed as part of our academic curriculum to enhance our technical skills and 
                    problem-solving abilities.

                    Our goal is to bridge the gap between theoretical concepts and real-world applications by designing and implementing an efficient, 
                    creative, and functional solution. Through this project, we gained hands-on experience in teamwork, research, design, development,
                    and documentation.

                    We believe that continuous learning and collaboration are the keys to innovation, and this
                    project reflects our effort to grow as aspiring professionals in our respective fields.
                </div>
                <br></br>
                <br></br>
                <div id="members">
                    <h1>Team Members</h1>
                        Pooja R -PES2UG24CS388
                        <br>
                        </br>
                        
                        Priyanka M -PES2UG24CS378
                        <br></br>
                        Priyanka N -PES2UG24CS379
                        <br></br>
                       
                        <br></br>
                        
                </div>
            </div>
        </div>
            
        
      </div>
    )

}