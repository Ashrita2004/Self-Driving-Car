let generationCount = 1;
let bestDistance = 0;
let carCanvas = document.getElementById("carCanvas");
carCanvas.width = 270;
let manualMode = false;

let networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 490;


let carCtx = carCanvas.getContext("2d");  // drawing context reference
let networkCtx = networkCanvas.getContext("2d");

let road = new Road(carCanvas.width/2,carCanvas.width*0.9);

const N=100;
let cars = generateCars(N);
let bestCar=cars[0];
if(localStorage.getItem("bestBrain")){
    for(let i=0;i<cars.length;i++){
        cars[i].brain=JSON.parse(
            localStorage.getItem("bestBrain"));
        if(i!=0){
            NeuralNetwork.mutate(cars[i].brain,0.1);
        }
    }
}
document.getElementById('manualModeToggle').onchange = (event) => {
    manualMode = event.target.checked;
    //bestCar.controls = new Control(manualMode ? "KEYS" : "AI");
};

const DUMMY_COUNT = 25;
const traffic = [];

let currentY = -4; // Start a little ahead of the player

for (let i = 0; i < DUMMY_COUNT; i++) {
    const lane = Math.floor(Math.random() * 4); // random lane 0,1,2,3

    // Increase Y by a large negative gap (to move upward / away)
    const gap = Math.floor(Math.random() * 300) + 800; // 800–1500px gap
    currentY -= gap;

    traffic.push(
        new Car(
            road.getLaneCenter(lane), // random lane position
            currentY,                 // increasing distance upward
            30,                       // width
            50,                       // height
            "DUMMY",
            2,                        // max speed for dummy cars
            getRandomColor()
        )
    );
}

document.onkeydown = (event) => {
    // Only update the controls IF the bestCar is in manual mode
     if (event.key.startsWith("Arrow")) {
        event.preventDefault(); 
    }
    if (manualMode && bestCar.controls.type === "KEYS") {
        switch (event.key) {
            case "ArrowLeft": bestCar.controls.left = true; break;
            case "ArrowRight": bestCar.controls.right = true; break;
            case "ArrowUp": bestCar.controls.forward = true; break;
            case "ArrowDown": bestCar.controls.reverse = true; break;
        }
    }
}

document.onkeyup = (event) => {
    // Only update the controls IF the bestCar is in manual mode
    if (manualMode && bestCar.controls.type === "KEYS") {
        switch (event.key) {
            case "ArrowLeft": bestCar.controls.left = false; break;
            case "ArrowRight": bestCar.controls.right = false; break;
            case "ArrowUp": bestCar.controls.forward = false; break;
            case "ArrowDown": bestCar.controls.reverse = false; break;
        }
    }
}

animate(0);

function save(){
    localStorage.setItem("bestBrain",
        JSON.stringify(bestCar.brain));
}

function discard(){
    localStorage.removeItem("bestBrain");
    const N = 100; // Use the same number of cars as in setup
    cars = generateCars(N);
    bestCar = cars[0];
}

function generateCars(N){
    
    const cars=[];
    for(let i=1;i<=N;i++){
        cars.push(new Car(road.getLaneCenter(1),100,30,50,"AI",2.5));
    }
    return cars;
}

function animate(time){
    for(let i=0;i<traffic.length;i++){
        traffic[i].update(road.borders,[]); // [] becoz we dont want the dummies get damaged of itself
    }   

    bestCar=cars.find(
        c=>c.y==Math.min(
            ...cars.map(c=>c.y)  //fitness function
        ));
    const currentControlType = bestCar.controls.type;
    const desiredControlType = manualMode ? "KEYS" : "AI";

    if (currentControlType !== desiredControlType) {
        bestCar.controls = new Control(desiredControlType);
    }
    const THRESHOLD = 0.5;
    for(let i=0;i<cars.length;i++){
        const car = cars[i];

        const isManualControlled = manualMode && (car === bestCar);
        
        if (!isManualControlled && car.controls.type === "AI" && car.sensor && !car.damaged) {
            car.controls.forward = 0;
            car.controls.reverse = 0;
            car.controls.left = 0;
            car.controls.right = 0;

            car.sensor.update(road.borders, traffic);
            if (car.sensor.readings.length > 0) {
                const offsets = car.sensor.readings.map(s => s == null ? 0 : 1 - s.offset);
                const outputs = NeuralNetwork.feedForward(offsets, car.brain);

                // ACT: Use AI output to update controls (Overrides manual key input for AI cars)
                car.controls.forward = outputs[0] > THRESHOLD;
                car.controls.reverse = outputs[1] > THRESHOLD;
                car.controls.left = outputs[2] > THRESHOLD;
                car.controls.right = outputs[3] > THRESHOLD;
            } 
        }
         // A. AI Logic (Only runs for cars that are not manually controlled and are not damaged)
        else if (isManualControlled && car.sensor && !car.damaged) {
            // For the manually controlled car, we still update the sensor 
            // so the visualization (drawSensor=true) is accurate.
                car.sensor.update(road.borders, traffic);
        }
        car.update(road.borders, traffic);
    }
    
    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;
    
    const aliveCars = cars.filter(c => !c.damaged).length;
    document.getElementById('carsAlive').innerText = `${aliveCars} / ${N}`;
    document.getElementById('genCount').innerText = generationCount;
            
            // Distance check (negative Y value is distance traveled)
    const currentDistance = -bestCar.y / 100;
    if (currentDistance > bestDistance) {
        bestDistance = currentDistance;
    }
    document.getElementById('bestDistance').innerText = `${bestDistance.toFixed(2)} m`;

    carCtx.save();
    carCtx.translate(0,-bestCar.y+carCanvas.height*0.7);

    road.draw(carCtx);
    for(let i=0;i<traffic.length;i++){
        traffic[i].draw(carCtx,"blue");
    }
    
   /* carCtx.globalAlpha=0.2;
    for(let i=0;i<cars.length;i++){
        cars[i].draw(carCtx,"green"); // draw the car
    }*/ 
    carCtx.globalAlpha=1;
    bestCar.draw(carCtx,"green",true);   
    carCtx.restore();

    networkCtx.lineDashOffset=-time/50;
    Visualizer.drawNetwork(networkCtx,bestCar.brain)
    requestAnimationFrame(animate); // calls animate method again n again nd gives illusion of movement we want 
}