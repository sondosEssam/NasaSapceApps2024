import "../App.css"
function NavBar(){
    return(
<>
<nav>
      <p>Orrery</p>
      <ul>
        <li><a href="todaysCard">Todays's Card</a></li>
        <li><a href="game">Mini Game</a></li>
        <li><a href="#">Library</a></li>
      </ul>
    </nav>
    <button id="explore-btn" class="expolore">Explore</button>
</>
    );
}