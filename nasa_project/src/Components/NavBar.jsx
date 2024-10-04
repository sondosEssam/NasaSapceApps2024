import "../App.css"
import { useState } from "react";
import TodaysCard from "./TodayCard";
function NavBar(){
  const[isOpen, setIsOpen] = useState(false);
  const openModal = () => setIsOpen(!isOpen);
    return(
<>
<nav>
      <p>Orrery</p>
      <ul>
        <li><a href="#" onClick={openModal}>Show Today's Card</a><TodaysCard onClose={openModal} isOpen={isOpen}/> </li>
        <li><a href="game">Mini Game</a></li>
        <li><a href="#">Library</a></li>
      </ul>
    </nav>
    <button id="explore-btn" className="expolore">Explore</button>
</>
    );
}
export default NavBar;