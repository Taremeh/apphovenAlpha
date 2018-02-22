import { Injectable } from "@angular/core";
import { BackendService } from "./backend.service";

import firestore = require("nativescript-plugin-firebase");
const firebase = require("nativescript-plugin-firebase/app");

@Injectable()
export class LevelService {

    // Regular LVL 15 = 450XP
    private xpMaxBeginner: Array<number> = [0, 50, 75, 100, 125, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420];

    // XP for Practicing
    practiceXp(practiceDuration: number){

        let dateNow = Date.now();
        console.log("TODAY: " + dateNow);

        const userStats = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("stats");
        
        let query = userStats
            .orderBy("dateStarted", "desc")
            .limit(1);
        
        query.get().then(querySnapshot => {
            querySnapshot.forEach(lastUserStatistic => {
                console.log(`${lastUserStatistic.id} => ${JSON.stringify(lastUserStatistic.data())}`);
                console.log("TIME: " + lastUserStatistic.data().dateStarted);

                const updateStatisticDoc = firebase.firestore()
                    .collection("user")
                    .doc(BackendService.token)
                    .collection("stats")
                    .doc(lastUserStatistic.id);
                


                // 30min -> 100 XP
                let xpAmount = 500 // Math.round(practiceDuration/1800*100);
                let xpNew: number = lastUserStatistic.data().xpCurrent + xpAmount;
                let currentLvl = lastUserStatistic.data().lvl;

                // Check if LVL-UP
                if(xpNew >= lastUserStatistic.data().xpMax) {
                    // Accounting last LVL-Entry
                    updateStatisticDoc.update({
                        xpCurrent: xpNew,
                        lastTouched: dateNow
                    }).then(() => {
                        console.log("XP added to User. XP: " + xpNew);
                    });

                    // Prepare new LVL-Entry
                    // > Add XP-Overflow to new LVL
                    if(xpNew > lastUserStatistic.data().xpMax) {
                        let moreXp = true;

                        for(let i=currentLvl; moreXp; i++) {
                            if(currentLvl <= 14) {
                                // Beginner-Metrics
                                if(xpNew > this.xpMaxBeginner[i]){
                                    currentLvl = currentLvl + 1;
                                    console.log("B-Upcoming LVL: " + currentLvl);
                                    xpNew = xpNew - this.xpMaxBeginner[i];
                                    console.log("B-XP Overflow: " + xpNew);
                                } else {
                                    moreXp = false;
                                }
                            } else {
                                // Regular-Metrics
                                if(xpNew > 2*Math.pow(currentLvl,2)){
                                    console.log("Rechnung: " + xpNew + " - " + (2*Math.pow(currentLvl, 2)));                                    
                                    
                                    xpNew = xpNew - (2*Math.pow(currentLvl,2));
                                    console.log("R-XP Overflow: " + xpNew);

                                    // Prepare Next Lvl
                                    currentLvl = currentLvl + 1;
                                    console.log("R-Upcoming LVL: " + currentLvl);
                                } else {
                                    moreXp = false;
                                }
                            }
                        }
                    } else {
                        currentLvl = currentLvl+1;
                        xpNew = 0;
                    }

                    // > Beginner Metrics (LVL < 15) vs Regular Metrics
                    let xpMax;
                    if(currentLvl < 15) {
                        xpMax = this.xpMaxBeginner[currentLvl];
                    } else {
                        // xpMax = 2*LVL^2
                        xpMax = 2*Math.pow(currentLvl,2);
                        console.log("XP MAX: " + xpMax);
                    }

                    // Add new LVL-Entry
                    return userStats.doc(String(currentLvl)).set({
                        dateStarted: dateNow,
                        lastTouched: dateNow,
                        lvl: currentLvl,
                        xpCurrent: xpNew,
                        xpMax: xpMax
                    }).then(documentRef => {
                        console.log(`Added new LVL-Entry`);
                    });

                } else {
                    // Add XP to current LVL
                    return updateStatisticDoc.update({
                        xpCurrent: xpNew,
                        lastTouched: dateNow
                    }).then(() => {
                        console.log("XP added to User. XP: " + xpNew);
                    });
                }
            });
        });
    }

    // Manual & Preset XP-Add
    addXp(reason: string, amount?: number) {
        if(reason == "recordedAudio") {

        } else if(reason == "dailyLogin") {

        } else {

        }
    }

    // Manual XP-Remove
    removeXp(reason: string, amount?: number) {

    }
}
