import { Component, OnInit, NgZone } from "@angular/core";
import firebase = require("nativescript-plugin-firebase");
import { PageRoute } from "nativescript-angular/router";
import { HttpService, BackendService, TimerPipe } from "../../shared";
import { Page } from "ui/page";
import * as application from "application";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import { Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import dialogs = require("ui/dialogs");
import { GraphLegendPipe } from "./graph-legend.pipe";
import observableArrayModule = require("data/observable-array");
import { SwipeGestureEventData } from "ui/gestures";


@Component({
    selector: "ah-practice-session",
    templateUrl: "pages/practice-session/practice-session.component.html",
    styleUrls: ["pages/practice-session/practice-session-common.css"],
})

export class PracticeSessionComponent implements OnInit {

    public smileIcons: Array<any>; // Smile-Icons
    public starIcon = String.fromCharCode(0xf006);

    public sessionsAvailable: boolean = false;
    public sessionArray: Array<any>;
    public sessionIdArray: Array<any>;

    public week;
    public currentWeek: number = 0; // 0 = Todays week
    public currentWeekName: string; // Displays user information about current week
    public longestPracticeDuration: number = 0;   
    public leg1;
    public leg2; 
    public legtop;
    public legtopChanged: boolean = false;
    public graphValue: boolean = false;
    public praticeTimeCalendar: Array<any>;

    constructor(private _pageRoute: PageRoute, private _page: Page, private _routerExtensions: RouterExtensions, private _router: Router, private _ngZone: NgZone) {
        this.week = new observableArrayModule.ObservableArray();
        this.sessionArray = [];
        this.sessionIdArray = [];
        this.praticeTimeCalendar = [];
        this.week = [];

        // Prepare Week-Array
        this.prepareWeekArray(true);

        /*

        SAMPLE-DATA
        
        this.week[0].value = 15;
        this.week[1].value = 5;
        this.week[2].value = 120;
        this.week[3].value = 60;
        this.week[4].value = 180;
        this.week[5].value = 120;
        this.week[6].value = 100;*/


        //console.log("MAX VAL: " + Math.max(this.week['value']));

        // Generating Smile Icon Array
        this.smileIcons = [];
        for (let i = 0; i < 3; i++){
            if (i == 0){
                this.smileIcons.push({iconCode: String.fromCharCode(0xf119), iconState: false, iconColor: "#FF6961", position: i+1});
            } else if (i == 1) {
                this.smileIcons.push({iconCode: String.fromCharCode(0xf11a), iconState: false, iconColor: "#F2CE59", position: i+1});
            } else if (i == 2) {
                this.smileIcons.push({iconCode: String.fromCharCode(0xf118), iconState: false, iconColor: "#8BF287", position: i+1});
            }
            
        }


        this.loadFirebaseData(true);
    }

    loadFirebaseData(initialize: boolean){

        firebase.query(
            (result) => {
                if (result.value) {
                    // Reset Practice Session Data Array:
                    this.sessionArray = [];
                    this.praticeTimeCalendar = [];
                    this.sessionIdArray = [];
                    this.longestPracticeDuration = 0;

                    console.log("NR 222: " + this.week[1].date);
                    this.sessionsAvailable = true;

                    let d = new Date();
                    
                    var lenSessions = Object.keys(result.value).length;
                    console.log("RESULT LENGTH: " + lenSessions);
                    for (let i = 0; i < lenSessions; i++) {
                        console.log("SESSION ID(s): "+ Object.keys(result.value)[i]);
                        this.sessionIdArray.push(Object.keys(result.value)[i]);
                    }

                    // initialize var for lastDate-Check
                    let lastDate;

                    for (let i = 0; i < this.sessionIdArray.length; i++) {

                        // date of user-session
                        let d = new Date(result.value[this.sessionIdArray[i]].date).setHours(0,0,0,0);

                        // if current and last date of user-session are the same, add the duration values
                        // (Same day => practice time addition)
                        if(d == lastDate){
                            console.log("DOPPEL VALUE`!!!!!!!!!!!!!!!!");
                            let duration = this.praticeTimeCalendar[i-1].duration + result.value[this.sessionIdArray[i]].duration;
                            
                            this.praticeTimeCalendar.push({
                                duration: duration,
                                date: d
                            });

                        } else {
                            let duration = result.value[this.sessionIdArray[i]].duration;

                            this.praticeTimeCalendar.push({
                                duration: duration,
                                date: d
                            });
                        }
                        
                        // Determine longestPracticeDuration of this week (for graph)
                        if(this.longestPracticeDuration < this.praticeTimeCalendar[i].duration
                            && this.praticeTimeCalendar[i].date >= this.week[0].date.getTime()){
                            this.longestPracticeDuration = this.praticeTimeCalendar[i].duration;
                            console.log("LONLONGLONG: d: " + this.praticeTimeCalendar[i].date + " week: " + this.week[0].date);
                        }

                        // Define current date of user-session as lastDate for next loop
                        lastDate = d;
                    }

                    
                    // Define roundValue => .5 steps equal 2
                    let roundValue = 2;

                    // Determine highest possible graphValue (after rounding)
                    this.legtop = this.longestPracticeDuration > 3600 ? Math.ceil(this.longestPracticeDuration/60/60*roundValue)*60*60/roundValue : Math.round(this.longestPracticeDuration/60*roundValue)*60/roundValue;

                    console.log("LEGTOP : " + this.legtop + " // LONGEST PRACT DUR: " + this.longestPracticeDuration);
                    // Round values and define Legend-Text (leg1 => top; leg2 => center)
                    if(this.legtop > 3600){
                        this.leg1 = Math.round(this.legtop/60/60*roundValue)/roundValue;
                        this.leg2 = Math.round(this.legtop/60/60/2*roundValue)/roundValue;
                    } else {
                        this.leg1 = Math.round(this.legtop/60);
                        this.leg2 = Math.round(this.legtop/60/2);
                    }
                    
                    /*this.leg1 = Math.round(this.legtop > 3600 ? this.legtop/60/60*roundValue : this.legtop/60)/roundValue;
                    console.log(this.leg1);
                    this.leg2 = Math.round(this.legtop > 3600 ? this.legtop/60/60/2*roundValue : this.legtop/60/2*roundValue)/roundValue;
                    console.log(this.leg2);
                    console.log("NR 222: " + this.week[1].date);*/
                    
                    // Reset Graph Value Indicator
                    this.graphValue = false;

                        for (let i = 0; i < this.sessionIdArray.length; i++) {
                            // Push result for ListView-Array
                            this._ngZone.run(() => {
                                this.sessionArray.push(result.value[this.sessionIdArray[i]]);
                            });
                            
                            if(this.legtop > 0) {
                                // prepare user-session Date (dateFirebase) for if-Check
                                let dateFirebase = new Date(result.value[this.sessionIdArray[i]].date);
                                dateFirebase.setHours(0,0,0,0)
                                console.log("FIREBASE DATE: " + dateFirebase);

                                // prepare graph Date (dateGraph) for if-Check
                                // let dateGraph = new Date(this.week[i].date);
                                // console.log("WEEK DATE: " + dateGraph);

                                // +++ EINFACH 7 CASES MACHEN, DIE GEPRÜFT WERDEN.
                                // CASES können später dynamisch sein +++
                                let graphHeight = 100;

                                console.log("NR 1: " + dateFirebase.getTime());

                                let checkDate = new Date();
                                console.log("NR 2: " + this.week[1].date);

                                this._ngZone.run(() => {
                                    if(dateFirebase.getTime() == this.week[0].date.getTime()){
                                        this.week[0].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                        this.graphValue = true;
                                    } else if (dateFirebase.getTime() == this.week[1].date.getTime()) {
                                        this.week[1].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                        this.graphValue = true;
                                    } else if (dateFirebase.getTime() == this.week[2].date.getTime()) {
                                        this.week[2].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                        this.graphValue = true;
                                    } else if (dateFirebase.getTime() == this.week[3].date.getTime()) {
                                        this.week[3].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                        this.graphValue = true;
                                    } else if (dateFirebase.getTime() == this.week[4].date.getTime()) {
                                        this.week[4].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                        this.graphValue = true;
                                    } else if (dateFirebase.getTime() == this.week[5].date.getTime()) {
                                        this.week[5].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                        this.graphValue = true;
                                    } else if (dateFirebase.getTime() == this.week[6].date.getTime()) {
                                        this.week[6].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                        this.graphValue = true;
                                    }
                                });
                            } else {
                                this.graphValue = false;
                            }

                            

                            /*
                            
                            ALTERNATIVE APPROACH (not fully working)
                            WILL BE DELETED
                            
                            switch(true) {
                                case (dateFirebase.getTime() == this.week[0].date.getTime()):
                                    console.log("YES TRIGGER:+");
                                    
                                    this.week[0].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                    this.graphValue = true;
                                    
                                    break;
                                case (dateFirebase.getTime() == this.week[1].date.getTime()):
                                    this.week[1].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                    this.graphValue = true;
                                    break;
                                case (dateFirebase.getTime() == this.week[2].date.getTime()):
                                    this.week[2].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                    this.graphValue = true;
                                    break;
                                case (dateFirebase.getTime() == this.week[3].date.getTime()):
                                    this.week[3].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                    this.graphValue = true;
                                    break;
                                case (dateFirebase.getTime() == this.week[4].date.getTime()):
                                    this.week[4].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                    this.graphValue = true;
                                    break;
                                case (dateFirebase.getTime() == this.week[5].date.getTime()):
                                    this.week[5].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                    this.graphValue = true;
                                    break;
                                case (dateFirebase.getTime() == this.week[6].date.getTime()):
                                    this.week[6].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                    this.graphValue = true;
                                    break;
                            }*/
                            /*

                            DOES NOT WORK BECAUSE OF DOUBLE FOR-LOOP

                            for(let wd = 0; wd < 7; wd++){
                                console.log("WD: " + wd);
                                console.log("1 " + this.week[1].date);
                                console.log("WEEK DATE" + this.week[wd].date);
                                // If dateGraph (This Mon, This Tue, This Wed...) == dateFirebase (e.g. Last Mon, This Tue, This Thu)
                                if(dateFirebase.getTime() == this.week[wd].date.getTime()){
                                    console.log("TRIGGERED TRIGGERED TRIGGERED");

                                    // Define max. Graph-Height
                                    let graphHeight = 100;

                                    // Set Graph-Height (+= Addition if value already exists)
                                    this.week[wd].value += (graphHeight / (this.legtop) * (result.value[this.sessionIdArray[i]].duration));
                                    
                                    // Graph-Value exists
                                    this.graphValue = true;
                                    
                                    /* 

                                    // NOT NEEDED ANYMORE
                                    // (Will be deleted in next Commit)
                                    
                                    this.week[wd].duration += result.value[this.sessionIdArray[i]].duration;

                                    if(this.week[wd].duration > this.longestPracticeDuration){
                                        this.longestPracticeDuration = this.week[wd].duration;

                                        let roundValue = 2;

                                        this.legtop = this.longestPracticeDuration > 3600 ? Math.ceil(this.longestPracticeDuration/60/60*roundValue)*60*60/roundValue : Math.round(this.longestPracticeDuration/60*roundValue)*60/roundValue;

                                        this.leg1 = Math.round(this.longestPracticeDuration > 3600 ? this.longestPracticeDuration/60/60*roundValue : this.longestPracticeDuration/60*roundValue)/roundValue;
                                        this.leg2 = Math.round(this.longestPracticeDuration > 3600 ? this.longestPracticeDuration/60/60/2*roundValue : this.longestPracticeDuration/60/2*roundValue)/roundValue;

                                        this.legtopChanged = true;

                                        console.log("TRUE TRUE TRUE  " + this.legtop + " VS  " + this.week[wd].duration);
                                    } 
                                }
                            }*/
                        }

                    console.log("Event type: " + result.type);
                    console.log("Key: " + result.key);
                    console.log("Value: " + JSON.stringify(result.value));

                } else {
                    this.sessionArray = null;
                    console.log("NO SESSIONS FOUND");
                }
            },
            "/user/" + BackendService.token + "/practice-session",
            {
                singleEvent: true,
                orderBy: {
                    type: firebase.QueryOrderByType.CHILD,
                    value: 'since' // mandatory when type is 'child'
                }
            }
        );
    }

    ngOnInit() {
        
        this._page.actionBarHidden = true;
        application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
            console.log("BACK BUTTON EVENT TRIGGERED");
            //this._router.navigate(['/addpiece']); 
        });
    }

    onSwipe(args: SwipeGestureEventData) {
        console.log("Swipe Direction: " + args.direction);
        if(args.direction == 1) {
            this.currentWeek = this.currentWeek - 1;
            this.prepareWeekArray(false);
            this.loadFirebaseData(false);
        } else if(args.direction == 2) {
            if(this.currentWeek != 0) {
                this.currentWeek = this.currentWeek + 1;
                this.prepareWeekArray(false);
                this.loadFirebaseData(false);
            }
        }
    }

    prepareWeekArray(initialize: boolean) {
        // Reset Week Array
        this.week = [];

        let dateModel = new Date();
        let selectedWeek = dateModel.getDate() + (this.currentWeek*7);
        
        let dateNow = new Date();
        dateNow.setDate(selectedWeek);

        console.log("current week: " + this.currentWeek);
        console.log("current date: " + dateNow);
        

        // Get todays Day as number (0-6, (SUN - SAT))
        let today = dateNow.getDay();
        console.log("TODAY " + today);

        // Get this weeks monday as Date (Now - (today as number) + (if today = SUN ? -6 : 1))
        let monday = dateNow.getDate() - today + (today == 0 ? -6 : 1);

        // console.log("MONDAY: " + dateNow.setDate(monday));
        console.log("THIS monday: " + monday);
        let mondayDate = new Date();
        mondayDate.setDate(selectedWeek);
        mondayDate.setDate(monday);
        console.log("MONDAY DATE" + mondayDate);

        let calendarDate;

        for (let i = 0; i < 7; i++){
            //console.log("hier2: " + dateNow.setDate(monday+1));
            //let calendarDateWithHours = new Date(mondayDate.getDate()+i);
            
            // Set Date
            i == 0 ? mondayDate.setDate(mondayDate.getDate()) : mondayDate.setDate(mondayDate.getDate()+1);

            console.log("monday:" + mondayDate);

            mondayDate.setHours(0,0,0,0);
            
            calendarDate = new Date(mondayDate);

            console.log("HOURS SET: " + calendarDate);

            this.week[i] = ({
                date: calendarDate,
                value: 0,
                duration: 0,
                position: i,
            });
            
        }

        this.week[0].name = "Mon";
        this.week[1].name = "Tue";
        this.week[2].name = "Wed";
        this.week[3].name = "Thu";
        this.week[4].name = "Fri";
        this.week[5].name = "Sat";
        this.week[6].name = "Sun";

        if(!initialize && this.currentWeek == 0) {
            this.currentWeekName = "This Week";
        } else if (this.currentWeek == 0) {
            this.currentWeekName = null;
        } else if (this.currentWeek == -1) {
            this.currentWeekName = "Last Week";
        } else {
            this.currentWeekName = this.week[0].date;
        }

    }

}