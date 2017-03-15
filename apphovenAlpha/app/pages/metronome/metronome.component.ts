import { Component, OnInit } from "@angular/core";
import { TempoTermPipe } from "./tempo-term.pipe";
import { PerformanceTestService } from "./performance-test.service";
let sound = require("nativescript-sound");
import * as application from "application";

@Component({
    selector: "ah-metronome",
    templateUrl: "pages/metronome/metronome.component.html",
})

export class MetronomeComponent implements OnInit {
    public metronome = sound.create("~/pages/metronome/audio/click.mp3"); // preload the audio file 
    public interval: number = 120;
    public timer: number;
    public counter: number = 0;
    public metronomeRunning: boolean = false;
    public i = 0;
    public worker;

    // Enable / Deactivate Performance Analysis & set amount of ticks before analysis starts.
    public devModeNumber = null; // null = deactivated; 1 to x ticks = activated

    constructor(public performanceTester: PerformanceTestService){
        this.worker;
    }

    ngOnInit(){
        //this.worker = new Worker('./workers/processor');
    }

    start(){
        
        this.stop();
        console.log("START: " + this.interval);

        this.tick(this.interval);
    }

    stop() {
        if(this.metronomeRunning){
            this.worker.terminate();
            this.metronomeRunning = false;
        }
        clearTimeout(this.timer);

    }

    setInterval(interval: number) {
        console.log("SETINTERVAL: " + interval);
        console.log("THIS.INTERVAL: " + this.interval);

        // BPM-Validator (Allowed values: 40 - 300)
        if(interval < 40) {
            this.interval = 40; 
            this.stop();
            this.tick(this.interval);
        } else if(interval > 300) {
            this.interval = 300;
            this.stop();
            this.tick(this.interval);
        } else {
            this.interval = interval;
            this.stop();
            this.tick(this.interval);
        }
    
        
    }

    public tick(tempo: number) {
        this.metronomeRunning = true;
        // Load Service-Worker to handle metronome-ticks
        this.worker = new Worker('./workers/processor');

        let that = this;

        this.worker.postMessage({ tempo: tempo });
        this.worker.onmessage = function(msg) {
            if (msg.data.success) {
                
                // DEV INSTRUCTION NOTES:
                // Stop idle animation
                // Update Image View
                // Terminate worker or send another message
                // that.metronome.play();
                
                // EVENTUALLY WILL NEVER REACH THIS POINT
                this.worker.terminate();

            } else {
                console.log("WORKER CHANGED");
                // DEV INSTRUCTION NOTES:
                // Stop idle animation
                // Display meaningful message
                // Terminate worker or send message with different parameters
            }
        }

        this.worker.onerror = function(err) {
            // console.log(`Error at: ${err.filename}, line: ${err.lineno} :`);
            console.log("ERROR: " + err.message);
        }


        /*
        
        PERFORMANCE TESTER
        (IMPLEMENTATION CURRENTLY DISABLED)
        (WILL ONLY BE CONTAINED IN DEV-VERSION)

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
        }*/
    }

    ngOnDestroy() {
        // Kills running metronome
        this.stop();
    }
}