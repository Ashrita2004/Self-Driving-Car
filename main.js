let carCanvas = document.getElementById("carCanvas");
carCanvas.width = 270;

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

const traffic=[
    new Car(road.getLaneCenter(1),-100,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(2),-330,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-230,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(1),-700,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(2),-1200,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-600,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(1),-830,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(2),-950,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-1020,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(1),-1200,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(2),-1430,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-1730,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(1),-2000,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(2),-2500,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-3600,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(1),-4830,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(2),-5950,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-7020,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(1),-8100,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(2),-9330,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-10230,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(1),-11700,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(2),-12690,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-14600,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(1),-17830,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(2),-19950,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-21020,30,50,"DUMMY",2,getRandomColor())       
];

animate();

function save(){
    localStorage.setItem("bestBrain",
        JSON.stringify(bestCar.brain));
}

function discard(){
    localStorage.removeItem("bestBrain");
}

function generateCars(N){
    
    const cars=[];
    for(let i=1;i<=N;i++){
        cars.push(new Car(road.getLaneCenter(1),100,30,50,"AI"));
    }
    return cars;
}

function animate(time){
    for(let i=0;i<traffic.length;i++){
        traffic[i].update(road.borders,[]); // [] becoz we dont want the dummies get damaged of itself
    }   

    for(let i=0;i<cars.length;i++){
        cars[i].update(road.borders,traffic);
    }

    bestCar=cars.find(
        c=>c.y==Math.min(
            ...cars.map(c=>c.y)  //fitness function
        ));

    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;
    
    carCtx.save();
    carCtx.translate(0,-bestCar.y+carCanvas.height*0.7);

    road.draw(carCtx);
    for(let i=0;i<traffic.length;i++){
        traffic[i].draw(carCtx,"blue");
    }
    
    carCtx.globalAlpha=0.2;
    for(let i=0;i<cars.length;i++){
        cars[i].draw(carCtx,"green"); // draw the car
    } 
    carCtx.globalAlpha=1;
    bestCar.draw(carCtx,"green",true);   
    carCtx.restore();

    networkCtx.lineDashOffset=-time/50;
    Visualizer.drawNetwork(networkCtx,bestCar.brain)
    requestAnimationFrame(animate); // calls animate method again n again nd gives illusion of movement we want 
}