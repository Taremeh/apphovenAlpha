import { Injectable } from "@angular/core";

export class PerformanceTestService {
    public timestamp1: number;
    public timestamp2: number;
    public timestampTotal: number[] = [0];
    public intervalAverage: number;

    getTimestamp(num: number, consoleLogValues: boolean){
        if(num === 1) {
            this.timestamp1 = Date.now();
            if(consoleLogValues) { console.log("Timestamp1: " + this.timestamp1) };
        } else if (num === 2) {
            this.timestamp2 = Date.now();
            if(consoleLogValues) { console.log("Timestamp2: " + this.timestamp2) };
        } else {
            console.log("Timestamp num not valid. Must be 1 or 2.");
        }
    }

    addTimestampToTotal(counter: number, consoleLogValues: boolean){
        this.timestampTotal[counter] = this.timestamp1-this.timestamp2;
        if(consoleLogValues) { console.log(">>> TIMESTAMP-Total: " + this.timestampTotal[counter]) };
    }

    analyze(theoreticalInterval: number){
        let dateSum = 0;
         for( let i = 1; i < this.timestampTotal.length; i++ ){
            dateSum += this.timestampTotal[i];
        }

        this.intervalAverage = dateSum/(this.timestampTotal.length-1); // -1 because the first value of the Array[0] is 0;

        let largest = Math.max.apply(Math, this.timestampTotal); // Get largest value

        this.timestampTotal[0] = 9999999; // The first value was 0, now it's changed to a very value to get the lowest value besides 0.        
        let smallest = Math.min.apply(Math, this.timestampTotal); // Get smallest value

        console.log("XXXXXXXXXXXXX");
        console.log("-------------");
        console.log("PERCORMANCE ANALYSIS (all values in ms) \n\n");
        console.log("THEORETICAL INTERVAL: " + theoreticalInterval);
        console.log("MEASURED INTERVAL AVERAGE: " + this.intervalAverage);
        console.log("-------------");
        console.log("Largest Interval (meas.): " + largest);
        console.log("Smallest Interval (meas.): " + smallest);
        console.log("-------------");
        console.log("Variance: " + (this.intervalAverage - theoreticalInterval));
        console.log("Measured Interval Range: " + (largest-smallest));
    }
}