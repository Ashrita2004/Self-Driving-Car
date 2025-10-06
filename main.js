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
if(!localStorage.getItem("beenHereBefore")){
    localStorage.setItem("beenHereBefore","true");
    localStorage.setItem("bestBrain",'{"levels":[{"inputs":[0.7134037395397386,0.4704391617329813,0,0,0],"outputs":[1,0,1,0,1,1],"biases":[-0.2857065784574137,0.15198050810320685,-0.13924253314793095,0.11578316440435818,-0.16178778119340148,-0.3000903730682978],"weights":[[-0.13515557540433842,0.07300698004528629,0.0040602602910803365,-0.06511672542187383,0.2351613353184897,-0.2012322725070096],[0.11375478789219415,0.19674169055322577,-0.10038853369062525,-0.08805459204957476,0.21925787393967702,0.15340538795108272],[0.006771304836725459,0.19973693546258126,-0.054730364561966574,-0.31855113026094745,-0.18011218120061373,-0.07367159677011853],[0.10788433228858771,-0.08604768151855152,-0.16601129743851203,-0.00019124113279275767,-0.2387343271874623,0.024133579587637094],[0.016549344407090646,0.07491472818610108,0.01776519928759422,0.061508369764843265,-0.22340799373690096,-0.04158178250497961]]},{"inputs":[1,0,1,0,1,1],"outputs":[1,1,1,0],"biases":[-0.06116069156441874,-0.0723274390864902,0.040602477018632524,0.36214587805918513],"weights":[[0.08902059474663654,-0.15740460212292795,-0.33036790341757627,-0.09502772355825113],[-0.025343350670927654,-0.3306790265709002,-0.015918008460683405,-0.3003507035765679],[0.3227266376583849,0.38057846051375693,0.18707727773028537,0.053444661926534916],[-0.2025644147140744,0.1184725671846302,-0.09069904024640596,-0.12430190885008531],[0.07527020196440684,-0.230469927588571,0.3007741658810536,0.22218297028978307],[-0.01361908920713352,0.16609276689516542,-0.09581290649261008,-0.039394098855477074]]}]}');
}
if(localStorage.getItem("bestBrain"))
    for(let i=0;i<cars.length;i++){
        cars[i].brain=JSON.parse(
            localStorage.getItem("bestBrain"));
        if(i>0){
            NeuralNetwork.mutate(cars[i].brain,0.1);
        }
    }

document.getElementById('manualModeToggle').onchange = (event) => {
    manualMode = event.target.checked;
    //bestCar.controls = new Control(manualMode ? "KEYS" : "AI");
};

const traffic=[
    new Car(road.getLaneCenter(1),-100,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-300,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(2),-300,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-500,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(1),-500,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(1),-700,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(2),-700,30,50,"DUMMY",2,getRandomColor()),
];


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

    const allDamaged = cars.every(c => c.damaged);
    if (allDamaged || bestCar.y < -30000) { // Also stop after a significant distance to cycle
                
        // Save the brain of the furthest car for the next generation's basis
        save(); 

                // Reset cars for the next generation (This is the "learning" step)
        generationCount++;
        cars = generateCars(N);

                // Apply the saved best brain and mutate
        const savedBrain = JSON.parse(localStorage.getItem("bestBrain"));
        if (savedBrain) {
            cars[0].brain = savedBrain;
            for (let i = 1; i < cars.length; i++) {
                cars[i].brain = JSON.parse(JSON.stringify(savedBrain));
                NeuralNetwork.mutate(cars[i].brain, 0.1); 
            }
        }
    }
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