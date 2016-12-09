import { Component } from "@angular/core";
import { TempoTermPipe } from "./tempo-term.pipe";
import { PerformanceTestService } from "./performance-test.service";
let sound = require("nativescript-sound");

@Component({
    selector: "ah-metronome",
    templateUrl: "pages/metronome/metronome.component.html",
})

export class MetronomeComponent{
    public metronome = sound.create("~/pages/metronome/audio/click.mp3"); // preload the audio file 
    public interval: number = 120;
    public timer: number;
    public counter: number = 0;

    // Enable / Deactivate Performance Analysis & set amount of ticks before analysis starts.
    public devModeNumber = null; // null = deactivated; 1 to x ticks = activated

    constructor(public performanceTester: PerformanceTestService){}

    start(){
        this.stop();
        console.log("START: " + this.interval);
        this.tick();
    }

    stop() {
        clearTimeout(this.timer);
    }

    setInterval(interval: number) {
        console.log("SETINTERVAL: " + interval);
        console.log("THIS.INTERVAL: " + this.interval);

        // BPM-Validator (Allowed values: 40 - 300)
        if(interval < 40) {
            this.interval = 40; 
        } else if(interval > 300) {
            this.interval = 300;
        } else {
            this.interval = interval; 
        }
    
        
    }

    public tick() {

        this.performanceTester.getTimestamp(1, true);

        if(this.counter !== 0){
            this.performanceTester.addTimestampToTotal(this.counter, true);
        }

        console.log("Tick: " + this.counter++);

        this.performanceTester.getTimestamp(2, true);

        this.metronome.play();
        this.timer = setTimeout(this.tick.bind(this), 60000/this.interval);

        console.log("XXXXXXXXXXXXX");

        // ANALYSIS (if devModeNumber true)
        if(this.counter-1 === this.devModeNumber){
            this.stop();
            let theoreticalInterval = 60000/this.interval;
            this.performanceTester.analyze(theoreticalInterval);
        }
    }

    ngOnDestroy() {
        // Kills running metronome
        this.stop();
    }
}