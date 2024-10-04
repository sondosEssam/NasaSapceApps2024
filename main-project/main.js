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
//laber rendrer
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(sizes.width, sizes.height);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
document.body.appendChild(labelRenderer.domElement);
//loader
const loader = new GLTFLoader();
//sun
loader.load('./assests/Sun.glb', function(gltf) {
    const sun = gltf.scene;

    // Adjust scale and position
    sun.scale.set(0.0002,0.0002,0.0002); // Adjust scale if necessary
    sun.position.set(0, 0, 0); // Adjust position if necessary

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
    'venus': { color: 0xffd085, size: 0.0001  },
    'earth': { color: 0x4b9bd7, size: 0.0001  },
    'mars': { color: 0xd48f8a, size: 0.0001  },
    'jupiter': { color: 0xc2b280, size: 0.0001  },
    'saturn': { color: 0xe2b21c, size: 0.0001  },
    'uranus': { color: 0x4bc1d2, size:0.0001  },
    'neptune': { color: 0x3e3e9c, size: 0.0001  }
};
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
                const size = 0.0008 * Math.pow(2, (16.5 - H) / 2.5);
                planetsData[full_name] = params;
                initializeOrbit(full_name, params, size,color, false);
            });
        }
    }


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
            ellipseObject.layers.set(1);
            scene.add(ellipseObject);
             if(isPlanet){
            loader.load(`./assests/${name}.glb`, function(gltf) {
                const body = gltf.scene;
                body.scale.set(size, size, size);
                body.layers.set(5);  // Set layer for planets
                scene.add(body);
                planetObjects[name] = body;
                addTextLabel(name, body);
                console.log(`${name} is on Layer:`, body.layers.mask);  
            });
        }
        else{
            const new_name = isPhaFile ? 'PHA' : 'NEO';
            loader.load(`./assests/${new_name}.glb`, function(gltf) {
                const body = gltf.scene;
                console.log("success");
                body.scale.set(size, size, size);
                body.layers.set(6); // Set layer for small bodies
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
camera.layers.enable(3); // Enable Layer 3 for text labels
camera.layers.enable(4); // Enable Layer 3 for text labels
camera.layers.enable(5); // Enable Layer 3 for text labels
camera.layers.enable(6);
//add to scene

scene.add(PointLight);
scene.add(light);
scene.add(camera);


//button 
const exploreBtn = document.getElementById('explore-btn');
function zoomOutCamera(){
  gsap.to(camera.position,{
    duration:2,
    z:camera.position.z + 20,
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
const toggleBodies = document.getElementById('toggle-bodies');
const toggleText = document.getElementById('toggle-text');
// Add event listeners
// Listen for changes in the "Show Orbits" checkbox
toggleOrbits.addEventListener('change', function() {
    if (this.checked) {
        camera.layers.enable(1);  // Enable Layer 1 for Orbits
    } else {
        camera.layers.disable(1); // Disable Layer 1 for Orbits
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
toggleBodies.addEventListener('change', function() {
    if (this.checked) {
        camera.layers.enable(6);  // Enable Layer 3 for Text Labels
    } else {
        camera.layers.disable(6); // Disable Layer 3 for Text Labels
    }
});
// zooming to palents and showing the cards

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('click', onClick, false);

// Set the raycaster to interact with the planet layer (assuming layer 5 for planets)
raycaster.layers.set(0);

function onClick(event) {
    // Normalize mouse coordinates (-1 to +1)
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;

    // Update the raycaster to take the mouse position into account
    raycaster.setFromCamera(mouse, camera);

    // Get an array of planet objects
    const planetMeshes = Object.values(planetObjects); // Use the planet objects for raycasting

    // Get an array of objects intersected by the ray
    const intersects = raycaster.intersectObjects(planetMeshes, true);  // Intersect planets

    console.log('Intersects:', intersects);  // Log intersects to check if raycasting works

    if (intersects.length > 0) {
        // Get the first intersected planet
        const clickedPlanet = intersects[0].object;

        console.log('Clicked Planet:', clickedPlanet.name);  // Log the clicked planet

        // Animate the camera to the clicked planet
        zoomToPlanet(clickedPlanet);

        // Display the information card for the clicked planet
        showInfoCard(clickedPlanet.name);
    } else {
        console.log('No planet intersected.');
    }
}

function zoomToPlanet(planet) {
    console.log('Zooming to planet:', planet);

    // Get the world position of the planet
    const targetPosition = new THREE.Vector3();
    planet.getWorldPosition(targetPosition);

    // Calculate an offset to position the camera slightly away from the planet
    const direction = new THREE.Vector3();
    direction.subVectors(camera.position, targetPosition).normalize();

    const distance = 0.1;  // Adjust this value to control how close to zoom
    const newCameraPosition = targetPosition.clone().add(direction.multiplyScalar(distance));

    // Animate the camera position using GSAP
    gsap.to(camera.position, {
        duration: 2,
        x: newCameraPosition.x,
        y: newCameraPosition.y,
        z: newCameraPosition.z,
        ease: "power2.inOut",
        onUpdate: function() {
            camera.lookAt(targetPosition);  // Ensure the camera looks at the planet
        }
    });
    console.log(targetPosition);
    console.log('New camera position:', newCameraPosition);
    console.log('Camera position:', camera.position);
}



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
        controls.update();

        Object.keys(planetsData).forEach(name => {
            updatePlanetPosition(name, time);
        });

        time += 0.01;

        renderer.render(scene, camera);
        labelRenderer.render(scene, camera); // Render labels
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