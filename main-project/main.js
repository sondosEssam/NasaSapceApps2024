import * as THREE from 'three';
import "./style.css";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; //animation
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import TodaysCard from './todaysCard.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
//sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};
//card

//scence
const scene = new THREE.Scene();
//plantes
const layerd_planets = [];
//laber rendrer
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(sizes.width, sizes.height);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none'; 
document.body.appendChild(labelRenderer.domElement);
//loader
var sun;
const loader = new GLTFLoader();
//sun
loader.load('./assests/Sun.glb', function(gltf) {
     sun = gltf.scene;

    // Adjust scale and position
    sun.scale.set(0.0006,0.0006,0.0006); // Adjust scale if necessary
    sun.position.set(0, 0, 0); // Adjust position if necessary
    sun.name = 'Sun'; // Set name for the Sun object
    scene.add(sun);
    console.log("sun loaded");
}, undefined, function(error) {
    console.error('An error occurred while loading the model:', error);
});

//-------------------planets-------------------
//setting vars
const todaysCard = new TodaysCard();
const planetNames = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const planetsData = {};
const planetObjects = {};
const scaleFactor = 10;
const orbitScale = 0.01;
const planetProperties = {
    'mercury': { color: 0x8c7c6c, size: 0.0001  },
    'venus': { color: 0xffd085, size: 0.0003  },
    'earth': { color: 0x4b9bd7, size: 0.0004  },
    'mars': { color: 0xd48f8a, size: 0.0005  },
    'jupiter': { color: 0xc2b280, size: 0.0006  },
    'saturn': { color: 0xe2b21c, size: 0.0007  },
    'uranus': { color: 0x4bc1d2, size:0.0005  },
    'neptune': { color: 0x3e3e9c, size: 0.0005  }
};
const planetDescriptions = {
    'mercury': { description:"The smallest planet in our solar system and nearest to the Sun, Mercury is only slightly larger than Earth's Moon. From the surface of Mercury, the Sun would appear more than three times as large as it does when viewed from Earth, and the sunlight would be as much as seven times brighter."},
    'venus': {description:"Venus is the second planet from the Sun, and Earth's closest planetary neighbor. Venus is the third brightest object in the sky after the Sun and Moon. Venus spins slowly in the opposite direction from most planets. Venus is similar in structure and size to Earth, and is sometimes called Earth's evil twin. Its thick atmosphere traps heat in a runaway greenhouse effect, making it the hottest planet in our solar system with surface temperatures hot enough to melt lead. Below the dense, persistent clouds, the surface has volcanoes and deformed mountains."  },
    'earth': { description:"While Earth is only the fifth largest planet in the solar system, it is the only world in our solar system with liquid water on the surface. Just slightly larger than nearby Venus, Earth is the biggest of the four planets closest to the Sun, all of which are made of rock and metal."  },
    'mars': { description:"Mars is one of the most explored bodies in our solar system, and it's the only planet where we've sent rovers to roam the alien landscape. NASA missions have found lots of evidence that Mars was much wetter and warmer, with a thicker atmosphere, billions of years ago."  },
    'jupiter': { description:"Jupiter is a world of extremes. It's the largest planet in our solar system – if it were a hollow shell, 1,000 Earths could fit inside. It's also the oldest planet, forming from the dust and gases left over from the Sun's formation 4.6 billion years ago. But it has the shortest day in the solar system, taking only 10.5 hours to spin around once on its axis."  },
    'saturn': { description:"Like fellow gas giant Jupiter, Saturn is a massive ball made mostly of hydrogen and helium. Saturn is not the only planet to have rings, but none are as spectacular or as complex as Saturn's. Saturn also has dozens of moons. From the jets of water that spray from Saturn's moon Enceladus to the methane lakes on smoggy Titan, the Saturn system is a rich source of scientific discovery and still holds many mysteries." },
    'uranus': { description:"Uranus is a very cold and windy world. The ice giant is surrounded by 13 faint rings and 28 small moons. Uranus rotates at a nearly 90-degree angle from the plane of its orbit. This unique tilt makes Uranus appear to spin sideways, orbiting the Sun like a rolling ball." },
    'neptune': { description:"Dark, cold, and whipped by supersonic winds, ice giant Neptune is more than 30 times as far from the Sun as Earth. Neptune is the only planet in our solar system not visible to the naked eye. In 2011 Neptune completed its first 165-year orbit since its discovery in 1846. Neptune is so far from the Sun that high noon on the big blue planet would seem like dim twilight to us. The warm light we see here on our home planet is roughly 900 times as bright as sunlight on Neptune."  }

}
    // Fetch data for planets
    async function fetchOrbitalParameters(planetName) {
        const response = await fetch(`https://api.le-systeme-solaire.net/rest/bodies/${planetName}`);
        const data = await response.json();

        const params = {
            semiMajorAxis: data.semimajorAxis * orbitScale / 1e6,
            eccentricity: data.eccentricity,
            orbitalPeriod: data.sideralOrbit,
            inclination: THREE.MathUtils.degToRad(data.inclination),
            longitudeAscendingNode: THREE.MathUtils.degToRad(data.longAscNode),
            argumentOfPeriapsis: THREE.MathUtils.degToRad(data.argPeriapsis)
        };
        console.log(`${planetName} Parameters:`, params);
        planetsData[planetName] = params;
        planetsData[planetName].description = planetDescriptions[planetName].description;
        initializeOrbit(planetName, params, planetProperties[planetName].size);
    }

    // Load data for NEOs and PHAs
    const files = ['neo_data.json', 'pha_data.json'];  // List of JSON file names
    var isPhaFile = false;
    async function loadSmallBodies() {
        for (const file of files) {
            const response = await fetch(file);
            const smallBodies = await response.json();

             isPhaFile = file === 'pha_data.json';

            // Iterate over each small body
            smallBodies.forEach(body => {
                const { full_name, a, e, i, om, w, per_y, H } = body;
                const AU_TO_KM = 149597870.7;
                const params = {
                    semiMajorAxis: a * orbitScale * AU_TO_KM / 1e6,
                    eccentricity: e,
                    orbitalPeriod: per_y,
                    inclination: THREE.MathUtils.degToRad(i),
                    longitudeAscendingNode: THREE.MathUtils.degToRad(om),
                    argumentOfPeriapsis: THREE.MathUtils.degToRad(w)
                };
                console.log(`Small Body: ${full_name}`, params);
                // Color based on whether the body is from PHA or NEO
                const color = isPhaFile ? 0xff0000 : 0xffa500;
                const size = 0.0009 * Math.pow(2, (16.5 - H) / 2.5);
                planetsData[full_name] = params;
                initializeOrbit(full_name, params, size,color, false);
            });
        }
    }

console.log(planetObjects);
        // Initialize orbit
        function initializeOrbit(name, params, size,color, isPlanet=true) {
            const { semiMajorAxis: a, eccentricity, inclination, longitudeAscendingNode, argumentOfPeriapsis } = params;
            const b = a * Math.sqrt(1 - eccentricity * eccentricity);
            const c = Math.sqrt(a * a - b * b);
            const numPoints = 1000;

            const curve = new THREE.EllipseCurve(-c, 0, a, b, 0, 2 * Math.PI, false, 0);
            const points = curve.getPoints(numPoints);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: color });
            const ellipseObject = new THREE.Line(geometry, material);

            const rotationMatrix = new THREE.Matrix4()
                .makeRotationZ(argumentOfPeriapsis)
                .multiply(new THREE.Matrix4().makeRotationX(inclination))
                .multiply(new THREE.Matrix4().makeRotationZ(longitudeAscendingNode));
            ellipseObject.applyMatrix4(rotationMatrix);

            // Set layer for orbits
            
            scene.add(ellipseObject);
             if(isPlanet){
            loader.load(`./assests/${name}.glb`, function(gltf) {
                const body = gltf.scene;
                body.name = name;
                body.scale.set(size, size, size);
                body.layers.set(6);
                ellipseObject.layers.set(6);
                layerd_planets.push(body);
                scene.add(body);
                planetObjects[name] = body;
                addTextLabel(name, body);
                console.log(body.name);
                console.log(`${name} is on Layer:`, body.layers.mask);
            });
        }
        else{
            const new_name = isPhaFile ? 'PHA' : 'NEO';
            loader.load(`./assests/${new_name}.glb`, function(gltf) {
                const body = gltf.scene;
                body.name=name;
                console.log("success");
                
                body.scale.set(size, size, size);
                body.layers.set(5); // Set layer for small bodies
                ellipseObject.layers.set(5);
                scene.add(body);
                planetObjects[name] = body;
                addTextLabel(name, body);
            });
        }
        }
//label adding to the planets
function addTextLabel(name, body) {
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = name.charAt(0).toUpperCase() + name.slice(1); // Capitalize the name
    div.style.marginTop = '-1em';
    div.style.color = 'white';

    const label = new CSS2DObject(div);
    label.position.set(0, planetProperties[name].size + 0.001, 0); // Offset above planet

    label.layers.set(4); // Set layer for text
    label.name = "label";
    body.add(label);
}


    // Kepler equation solver
    function solveKepler(M, e, tolerance = 1e-6) {
        let E = M;
        let delta;
        do {
            delta = E - e * Math.sin(E) - M;
            E = E - delta / (1 - e * Math.cos(E));
        } while (Math.abs(delta) > tolerance);
        return E;
    }


   // Update position
   function updatePlanetPosition(name, time) {
    const params = planetsData[name];
    const { semiMajorAxis: a, eccentricity, orbitalPeriod, inclination, longitudeAscendingNode, argumentOfPeriapsis } = params;
    const body = planetObjects[name];

    // For small bodies without orbital period, calculate it
    // const period = orbitalPeriod || Math.sqrt(Math.pow(a / orbitScale, 3)) * 365.25;
    const meanAnomaly = (2 * Math.PI / orbitalPeriod) * time;
    const eccentricAnomaly = solveKepler(meanAnomaly, eccentricity);

    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
    );

    const r = a * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly));

    const x = r * Math.cos(trueAnomaly);
    const y = r * Math.sin(trueAnomaly);

    const position = new THREE.Vector3(x, y, 0);

    position.applyAxisAngle(new THREE.Vector3(0, 0, 1), longitudeAscendingNode);
    position.applyAxisAngle(new THREE.Vector3(1, 0, 0), inclination);
    position.applyAxisAngle(new THREE.Vector3(0, 0, 1), argumentOfPeriapsis);

    body.position.copy(position);
}



//general settting
//light
const light = new THREE.AmbientLight(0xffffff, 1,100);
const PointLight = new THREE.PointLight(0xffffff, 1);
PointLight.position.set(0, 10, 10);
//camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000); //angle, aspect ratio, near, far
camera.position.set(0, 0.02, 0.02); // Correct method call
camera.add(light);
camera.layers.disable(1); // Enable Layer 1 for orbits
camera.layers.disable(2); // Enable Layer 2 for planets (although Layer 2 is the default, enabling it explicitly)
camera.layers.disable(5); // Enable Layer 3 for text labels
camera.layers.enable(4); // Enable Layer 3 for text labels
//camera.layers.enable(5); // Enable Layer 3 for text labels
camera.layers.disable(6);
//add to scene

scene.add(PointLight);
scene.add(light);
scene.add(camera);


//button
const exploreBtn = document.getElementById('explore-btn');
function zoomOutCamera(){
  gsap.to(camera.position,{
    duration:2,
    z:camera.position.z + 12,
    ease: "power2.inOut",
    onComplete:()=>{
      controls.enableRotate = true;
      controls.autoRotate = false;
    }
  })
}
exploreBtn.addEventListener('click', ()=>{
zoomOutCamera();
exploreBtn.style.display = 'none';
})
//toggle-menu
const toggleMenuBtn = document.getElementById('toggle-menu-btn');
const layerMenu = document.getElementById('layer-toggle-menu');

toggleMenuBtn.addEventListener('click', () => {
    console.log('Toggle button clicked!'); // Check if this logs correctly
    if (layerMenu.style.right === '0px') {
        layerMenu.style.right = '-250px'; // Hide the menu
    } else {
        layerMenu.style.right = '0px'; // Show the menu
    }
});
// Get the checkboxes
const toggleOrbits = document.getElementById('toggle-orbits');
const togglePlanets = document.getElementById('toggle-planets');
const toggleText = document.getElementById('toggle-text');
// Add event listeners
// Listen for changes in the "Show Orbits" checkbox
toggleOrbits.addEventListener('change', function() {
    if (this.checked) {
        camera.layers.enable(6);  // Enable Layer 1 for Orbits
    } else {
        camera.layers.disable(6); // Disable Layer 1 for Orbits
    }
});

// Listen for changes in the "Show Planets" checkbox
togglePlanets.addEventListener('change', function() {
    if (this.checked) {
        camera.layers.enable(5);  // Enable Layer 2 for Planets
    } else {
        camera.layers.disable(5); // Disable Layer 2 for Planets
    }
});

// Listen for changes in the "Show Labels" checkbox
toggleText.addEventListener('change', function() {
    if (this.checked) {
        camera.layers.enable(4);  // Enable Layer 3 for Text Labels
    } else {
        camera.layers.disable(4); // Disable Layer 3 for Text Labels
    }
});
// Listen for changes in the "Show Labels" checkbox

// zooming to palents and showing the cards

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentPlanet = null;  // To track the currently clicked planet
window.addEventListener('click', onClick, false);
//CARD
const card = document.createElement('div');
card.className = 'planet-card';  // Add styling class for card
card.style.position = 'absolute';  // Position it absolutely
card.style.padding = '10px';
card.style.background = 'rgba(0, 0, 0, 0.8)';
card.style.color = 'white';
card.style.display = 'none';  // Start with card hidden
document.body.appendChild(card);  // Add card to the document body

// Set the raycaster to interact with the planet layer (assuming layer 5 for planets)
raycaster.layers.set(0);

function onClick(event) {
    // Normalize mouse coordinates (-1 to +1)
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;

    // Update the raycaster to take the mouse position into account
    raycaster.setFromCamera(mouse, camera);

    // Get an array of celestial objects (planets and the Sun)
    const celestialBodies = [...Object.values(planetObjects), sun];
console.log(celestialBodies);
console.log("-----------------------------------------------------------------");
    // Get an array of objects intersected by the ray
    const intersects = raycaster.intersectObjects(celestialBodies, true);
    console.log("Raycaster intersects:", intersects);  // Add logging
    if (intersects.length > 0) {
        const clickedBody = intersects[0].object;
      clickedBody.name = intersects[0].object.parent.name;
                // Log the name of the clicked object for debugging
                console.log("Clicked object name:", clickedBody.name);
        
        if (clickedBody.name === 'Sun') {
            // Call zoomToSun when the Sun is clicked
            zoomToSun(sunObject);
        } else {
            // Otherwise zoom to the planet
            zoomToPlanet(clickedBody);
            showPlanetCard(clickedBody);
        }
            }
        else{
            hidePlanetCard(); // Hide the card if no planet is clicked
        }
    
}
function toScreenPosition(obj) {
    const vector = new THREE.Vector3();
    const canvas = renderer.domElement;

    obj.getWorldPosition(vector);  // Get the planet's world position
    vector.project(camera);  // Project the 3D position to 2D

    const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (vector.y * -0.5 + 0.5) * canvas.clientHeight;
    
    return { x, y };
}
// Function to show the card with the planet's information
function showPlanetCard(planet, x, y) {
    const planetKey = planet.name.toLowerCase();
    const infoCard = document.querySelector('.planet-card');
    const closeButton = document.querySelector('.close-btn'); 
    
    // Update card content dynamically based on the planet
    card.textContent = `${planetDescriptions[planet.name].description}`;
    if (planetDescriptions[planetKey]) {
        // Update the card content with the planet's description
        infoCard.innerHTML = `<h2>${planet.name}</h2><p>${planetDescriptions[planetKey].description}</p>`;
        closeButton.style.display = 'block';

        // Make the card visible on the right side of the page
        infoCard.style.display = 'block';
        infoCard.style.right = '80%';  // Position it on the right side
        infoCard.style.top = '20%';   // Adjust the top position to your needs
        closeButton.addEventListener('click', hidePlanetCard);
    
    } else {
        console.warn(`No description found for planet: ${planet.name}`);
    }
}


// Function to hide the card
function hidePlanetCard() {
    const infoCard = document.querySelector('.planet-card');  // Select the card div from the HTML
    infoCard.style.display = 'none';  // Hide the card
    currentPlanet = null;  // Clear the currently selected planet
}

// Add the event listener for mouse clicks
window.addEventListener('click', onClick);
//zoom to sun 
function zoomToSun(sun) {
    console.log('Zooming to Sun:', sun);

    // Get the world position of the Sun
    const sunPosition = new THREE.Vector3();
    sun.getWorldPosition(sunPosition);

    // Calculate an offset to position the camera slightly away from the Sun
    const direction = new THREE.Vector3();
    direction.subVectors(camera.position, sunPosition).normalize();

    // Set a closer zoom distance for a better view of the Sun (Adjust this value as needed)
    const zoomDistance = 5;  // Larger zoom distance for the Sun since it's bigger

    // Calculate the new camera position closer to the Sun
    const newCameraPosition = sunPosition.clone().add(direction.multiplyScalar(zoomDistance));

    // Animate the camera position using GSAP for smoother zoom and easing
    gsap.to(camera.position, {
        duration: 3,  // Adjust the duration as needed
        x: newCameraPosition.x,
        y: newCameraPosition.y + 1,  // Adjust the height offset for a better angle
        z: newCameraPosition.z,
        ease: "power4.inOut",  // Smooth easing for gradual zoom
        onUpdate: function() {
            // Ensure the camera looks at the Sun during the zoom
            camera.lookAt(sunPosition);

            // Continuously update controls to follow along the zoom
            controls.target.copy(sunPosition);  // Update the control's target
            controls.update();  // Ensure the controls are updated with the new target
        },
        onComplete: function() {
            // Finalize controls once the zoom finishes
            controls.target.copy(sunPosition);
            controls.update();  // Ensure the controls are updated with the final target
        }
    });
}

//
function zoomToPlanet(planet) {
    console.log('Zooming to planet:', planet);

    // Get the world position of the planet
    const targetPosition = new THREE.Vector3();
    planet.getWorldPosition(targetPosition);

    // Calculate an offset to position the camera slightly away from the planet
    const direction = new THREE.Vector3();
    direction.subVectors(camera.position, targetPosition).normalize();

    // Set a closer zoom distance for a better view of the planet
    const zoomDistance = 0.5;  // Adjust this value to control how close to zoom (closer to 1 for nearer)

    // Calculate the new camera position closer to the planet
    const newCameraPosition = targetPosition.clone().add(direction.multiplyScalar(zoomDistance));

    // Animate the camera position using GSAP for smoother zoom and easing
    gsap.to(camera.position, {
        duration: 2,  // Longer duration for smoother transition
        x: newCameraPosition.x,
        y: newCameraPosition.y + 0.2,  // Slightly elevate the camera to give a nice angle
        z: newCameraPosition.z,
        ease: "power2.inOut",  // Smooth in and out easing for a natural zoom effect
        onUpdate: function() {
            // Ensure the camera looks at the planet during the zoom
            camera.lookAt(targetPosition);

            // Continuously update controls to follow along the zoom
            controls.target.copy(targetPosition);  // Update the control's target
            controls.update();  // Ensure the controls are updated with the new target
          
        },
        onComplete: function() {
            // Finalize controls once the zoom finishes
            controls.target.copy(targetPosition);
            controls.update();  // Ensure the controls are updated with the final target
          
        }
    });
}
//background
// Set the background color to black
// Set the background color to black
// Set the background color to black
function generateStars() {
    // Number of stars you want in your background
    const numStars = 1000;

    // Geometry to hold all the star positions
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(numStars * 3); // 3 coordinates per star (x, y, z)

    // Randomly place each star in a 3D sphere around the scene
    for (let i = 0; i < numStars; i++) {
        const index = i * 3;
        const radius = 500; // Distance from the center of the scene

        // Generate random positions in a spherical shape
        const theta = THREE.MathUtils.randFloatSpread(360); // Random angle in degrees
        const phi = THREE.MathUtils.randFloatSpread(360); // Random angle in degrees

        // Convert spherical coordinates to cartesian coordinates
        starPositions[index] = radius * Math.sin(theta) * Math.cos(phi); // X
        starPositions[index + 1] = radius * Math.sin(theta) * Math.sin(phi); // Y
        starPositions[index + 2] = radius * Math.cos(theta); // Z
    }

    // Apply positions to the geometry
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    // Create material for the stars (white color, small points)
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff, // White stars
        size: 3, // Size of each star
        sizeAttenuation: true // Enable size attenuation for depth effects
    });

    // Create a Points mesh from the geometry and material
    const starField = new THREE.Points(starGeometry, starMaterial);

    // Add the star field to the scene
    scene.add(starField);
}

generateStars();
//renderer
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({ canvas});
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);


//controls
const controls = new OrbitControls(camera, canvas);
controls.enablePan = false;
controls.enableDamping = true;
controls.enableRotate = true;
controls.autoRotate = false;
controls.autoRotateSpeed = 2;
controls.dampingFactor = 0.25;
controls.minDistance = 1;
controls.maxDistance = 100;
controls.screenSpacePanning = false;


    // Animation loop
    let time = 0;
    function animate() {
        requestAnimationFrame(animate);


        Object.keys(planetsData).forEach(name => {
            updatePlanetPosition(name, time);
        });

        time += 0.001;
        layerd_planets.forEach(object => {
            object.rotation.y += 0.005;
        });
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera); // Render labels
        controls.update();
    }

    // Fetch data and start animation
    async function init() {
        await Promise.all(planetNames.map(fetchOrbitalParameters));
       await loadSmallBodies();
        animate();
    }

    init();

//resize
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
  });
//timeline

/**
 *
 *
 *
 * //helper
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);


 */