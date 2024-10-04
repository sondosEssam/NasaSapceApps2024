let score = 0;
const totalPlanets = 10;
const matchedPlanets = {};

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
    event.preventDefault();
    const draggedCardId = event.dataTransfer.getData("text");
    const targetCard = event.target.closest('.card');
    const match = targetCard.getAttribute('data-match');


    if (draggedCardId === match) {
        score++;
        document.getElementById("counter").innerHTML = `Correct Matches: ${score}`;
    }

    targetCard.appendChild(document.getElementById(draggedCardId));
}

function showResult() {
    score = Object.values(matchedPlanets).filter(isCorrect => isCorrect).length;
    document.getElementById("result").innerHTML = `You Scored ${score} out of 10`;
}




// let score = 0;
// const totalPlanets = 8;

// function allowDrop(event) {
//     event.preventDefault();
// }

// function drag(event) {
//     event.dataTransfer.setData("text", event.target.id);
// }

// function drop(event) {
//     event.preventDefault();
//     const draggedCardId = event.dataTransfer.getData("text");
//     const targetCard = event.target.closest('.card');
//     const match = targetCard.getAttribute('data-match');

//     // Check if the dropped card matches the description
//     if (draggedCardId === match) {
//         score++;
//         document.getElementById("counter").innerHTML = `Correct Matches: ${score}`;
//     }

//     targetCard.appendChild(document.getElementById(draggedCardId));
// }

// function showResult() {
//     document.getElementById("result").innerHTML = `You matched ${score} out of ${totalPlanets} planets correctly!`;
// }