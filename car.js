class Car{
    constructor(x,y,width,height,controlType,maxSpeed){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed=0.02;
        this.acceleration=0.06;
        this.maxSpeed=maxSpeed;
        this.friction=0.03;
        this.angle=0;
        this.damaged=false;

        this.useBrain=controlType=="AI";

        if(controlType!="DUMMY"){
            this.sensor=new Sensor(this);
            this.brain=new NeuralNetwork(
                [this.sensor.rayCount,6,4]
            );
        }
       // 🔑 CRITICAL FIX: Only DUMMY cars get a control object initially.
        // AI cars start with an UNSET placeholder.
        if (controlType === "DUMMY") {
             this.controls = new Control("DUMMY");
        } else if (controlType === "AI") {
            this.controls = new Control("AI");
        } else {
            this.controls = new Control("KEYS");
        }

        this.img=new Image();
        this.img.src="download.png";

        this.mask=document.createElement("canvas");
        this.mask.width=width;
        this.mask.height=height;
        
        const maskCtx=this.mask.getContext("2d");
        this.img.onload=()=>{
            maskCtx.fillStyle=color;
            maskCtx.rect(0,0,this.width,this.height);
            maskCtx.fill();

            maskCtx.globalCompositeOperation="destination-atop"; // previous polygon intersects with the img shape nd colour of polygon will remain only in the common area b/w polygon and car img
            maskCtx.drawImage(this.img,0,0,this.width,this.height);
        }
    }

    update(roadBorders, traffic) {
    if (!this.damaged) {
        // 1️⃣ Move
        this.#move();
        this.polygon = this.#createPolygon();
        this.damaged = this.#assessDamage(roadBorders, traffic);

        // 2️⃣ Update sensor
        if (this.sensor) this.sensor.update(roadBorders, traffic);

        // 3️⃣ Apply AI if this car is AI
        if (this.controls.type === "AI" && this.sensor) {
            const offsets = this.sensor.readings.map(s => s == null ? 0 : 1 - s.offset);
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);

            this.controls.forward = outputs[0] > 0.5;
            this.controls.left    = outputs[1] > 0.5;
            this.controls.right   = outputs[2] > 0.5;
            this.controls.reverse = outputs[3] > 0.5;
        }
    }
}


    #assessDamage(roadBorders,traffic){
        for(let i=0;i<roadBorders.length;i++){
            if(polysIntersect(this.polygon,roadBorders[i])){
                return true;
            }
        }

        for(let i=0;i<traffic.length;i++){
            if(polysIntersect(this.polygon,traffic[i].polygon)){
                return true;
            }
        }

        return false;
    }

    #createPolygon(){
        const points=[];
        const rad=Math.hypot(this.width,this.height)/2;
        const alpha=Math.atan2(this.width,this.height);
        points.push({
            x:this.x-Math.sin(this.angle-alpha)*rad,
            y:this.y-Math.cos(this.angle-alpha)*rad
        });

        points.push({
            x:this.x-Math.sin(this.angle+alpha)*rad,
            y:this.y-Math.cos(this.angle+alpha)*rad
        });

        points.push({
            x:this.x-Math.sin(Math.PI+this.angle-alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle-alpha)*rad
        });

        points.push({
            x:this.x-Math.sin(Math.PI+this.angle+alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle+alpha)*rad
        });
        return points;

    }
    
    #move(){
        if(this.controls.forward){
            this.speed+=this.acceleration;
        }
        if(this.controls.reverse){
            this.speed-=this.acceleration;
        }
        if(this.speed>this.maxSpeed){
            this.speed=this.maxSpeed;
        }
        if(this.speed<-this.maxSpeed/2){
            this.speed=-this.maxSpeed/2;
        }
        if(this.speed>0){
            this.speed-=this.friction;
        }
        if(this.speed<0){
            this.speed+=this.friction;
        }
        if(Math.abs(this.speed)<this.friction){
            this.speed=0;
        }
        if(this.speed != 0 || this.controls.forward || this.controls.reverse){
        
        // CRITICAL: Determine the intended direction (flip) based on controls
            let flip = 0;
            if(this.controls.forward || (this.controls.reverse && this.speed > 0) ) {
                flip = 1; // Moving forward (or intended forward)
            } else if (this.controls.reverse || (this.controls.forward && this.speed < 0) ) {
                flip = -1; // Moving backward (or intended backward)
            } else if (this.speed != 0) {
            // Use current speed if no controls are pressed (for coasting movement)
                flip = this.speed > 0 ? 1 : -1;
            }

        // Only allow turning if a direction (flip) has been determined
            if (flip !== 0) { 
                if(this.controls.left){
                    this.angle += 0.03 * flip;
                }
                if(this.controls.right){
                    this.angle -= 0.03 * flip;
                }
            }
        }     
        this.x-=Math.sin(this.angle)*this.speed;
        this.y-=Math.cos(this.angle)*this.speed;
    }

    draw(ctx,drawSensor=false){
        if(this.sensor && drawSensor){
            this.sensor.draw(ctx);
        }

        ctx.save();
        ctx.translate(this.x,this.y);
        ctx.rotate(-this.angle);
        if(!this.damaged){
            ctx.drawImage(this.mask,
                -this.width/2,
                -this.height/2,
                this.width,
                this.height);
            ctx.globalCompositeOperation="multiply";
        }
        ctx.drawImage(this.img,
            -this.width/2,
            -this.height/2,
            this.width,
            this.height);
        ctx.restore();

    }
}
