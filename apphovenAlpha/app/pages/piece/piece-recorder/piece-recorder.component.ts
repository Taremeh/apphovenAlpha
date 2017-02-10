import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { setInterval, setTimeout, clearInterval } from "timer";
import { PageRoute } from "nativescript-angular/router";
import { View } from "ui/core/view";
import { Color } from "color";
import { Page } from "ui/page";
import { TimerPipe } from "./timer.pipe";
import firebase = require("nativescript-plugin-firebase");
import { BackendService } from "../../../shared";
import { Observable as RxObservable } from 'rxjs/Observable';
import dialogs = require("ui/dialogs");


@Component({
    selector: "ah-piece-recorder",
    templateUrl: "pages/piece/piece-recorder/piece-recorder.component.html",
    styleUrls: ["pages/piece/piece-recorder/piece-recorder-common.css"]
})
export class PieceRecorderComponent implements OnInit {
    
    public routerParamIds: Array<any>;

    public timer: number; // Timeout Var
    public time: number = 0; // Passed Time in sec

    public ratingIcons: Array<any>; // Rating-Star-Icons
    public smileIcons: Array<any>; // Smile-Icons

    // Recording-Time Button Text & State
    public recordingTimeButton: string = "Record Session";
    public recordingTimeState: boolean = false;

    // Button & Button-Container States
    public button1: boolean = true;
    public buttonContainer: boolean = false;

    public userSessionNotes: string; // User Notes

    public sessionProgressRating: number; // User Rating (1-5)
    public sessionHappinessRating: number; // User Rating (1 / 2 / 3)

    public showPiece: boolean = false;

    public myItems: RxObservable<Array<any>>;

    public pieceMovementArray: Array<any>;
    public pieceMovementArrayNotSelected: Array<any>;
    public pieceTitle;
    public pieceWorkNumber;
    public movementTitle;
    public sessionStartedDate;

    constructor(private _pageRoute: PageRoute, private _page: Page){
        this.routerParamIds = [];
        this._pageRoute.activatedRoute
            .switchMap(activatedRoute => activatedRoute.params)
            .forEach((params) => { 
                this.routerParamIds['pieceId'] = params['pieceId']; 
                this.routerParamIds['movementId'] = params['movementId']; 
            });

        // Generating Star Icon Array
        this.ratingIcons = [];
        for (let i = 0; i < 5; i++){
            this.ratingIcons.push({
                iconCode: String.fromCharCode(0xf006),
                iconState: false,
                position: i+1
            });
        }

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

        // FETCHING PIECE INFORMATION FROM firebase
        this.pieceMovementArray = [];
        this.pieceMovementArrayNotSelected = [];
        var items = [];
        var subscr
        this.myItems = RxObservable.create(subscriber => {
            subscr = subscriber;
            subscriber.next(items);
            return function () {
                console.log("Unsubscribe called!!!");
            }
        });

        firebase.query(
            (result) => {
                if (result) {
                    console.log("Event type: " + result.type);
                    console.log("Key: " + result.key);
                    console.log("Value: " + JSON.stringify(result.value));

                    if(result.value.movementItem){
                        console.log("MOVEMENTS FOUND");
                        this.movementTitle = result.value.movementItem[this.routerParamIds['movementId']].title;
                    } else {
                        console.log("NO MOVEMENTS FOUND");
                    }
                    
                    this.pieceTitle = result.value.pieceTitle;
                    this.pieceWorkNumber = result.value.pieceWorkNumber;

                } else {
                    console.log("Fatal Error: Piece not found");
                }
            },
            "/user/" + BackendService.token + "/piece/" + this.routerParamIds['pieceId'],
            {
                singleEvent: true,
                orderBy: {
                    type: firebase.QueryOrderByType.CHILD,
                    value: 'since'
                }
            }
        );
    }

    @ViewChild("sessionRatingContainer") sessionRatingContainer: ElementRef;

    ngOnInit() {
        this._page.actionBarHidden = true;
        console.log("PIECE-ID: "+this.routerParamIds['pieceId']);
        console.log("MOVEMENT-ID: "+this.routerParamIds['movementId']);
    }

    toggleRecordingTime(){
        let sessionRatingContainer = <View>this.sessionRatingContainer.nativeElement;

        if(this.recordingTimeState){
            sessionRatingContainer.style.visibility = "visible";
            this.button1 = false;
            this.buttonContainer = true;

            this.recordingTimeState = false;
            this.recordingTimeButton = "Restart";
            this.stop();
        } else {
            sessionRatingContainer.style.visibility = "collapse";

            this.recordingTimeState = true;
            this.recordingTimeButton = "Stop Recording";
            this.start(1);
        }
    }

    // Turned out, that this functions isn't useful. Will be deleted in next Commit
    continueRecordingTick() {
        //var now = new Date();
        /* 
        this.recordingTime[this.recordingTimeCycle].h = now.getHours() - this.timeMetronomeStarted.getHours() + this.recordingTime[this.recordingTimeCycle-1].h;
        this.recordingTime[this.recordingTimeCycle].m = now.getMinutes() - this.timeMetronomeStarted.getMinutes() + this.recordingTime[this.recordingTimeCycle-1].m;
        this.recordingTime[this.recordingTimeCycle].s = now.getSeconds() - this.timeMetronomeStarted.getSeconds() + this.recordingTime[this.recordingTimeCycle-1].s;
        var h = now.getHours() - this.timeMetronomeStarted.getHours() + this.recordingTime.h;
        var m = now.getMinutes() - this.timeMetronomeStarted.getMinutes() + this.recordingTime.m;
        var s = now.getSeconds() - this.timeMetronomeStarted.getSeconds() + this.recordingTime.s;


        this.time = h + ":" + m + ":" + s;
        this.timer = setTimeout(this.continueRecordingTick.bind(this), 500);


        if((now.getSeconds() - this.timeMetronomeStarted.getSeconds()) + this.recordingTime[this.recordingTimeCycle-1].s < 0){
            this.recordingTime[this.recordingTimeCycle].s = 60 + (now.getSeconds() - this.timeMetronomeStarted.getSeconds()) + this.recordingTime[this.recordingTimeCycle-1].s;
        } else {
            this.recordingTime[this.recordingTimeCycle].s = now.getSeconds() - this.timeMetronomeStarted.getSeconds() + this.recordingTime[this.recordingTimeCycle-1].s;
        }
        if(this.recordingTime[this.recordingTimeCycle].s +  == 0){
            this.recordingTime[this.recordingTimeCycle].m += 1;
        }
        if(this.recordingTime[this.recordingTimeCycle].m == 60) {
            this.recordingTime[this.recordingTimeCycle].h += 1;
            this.recordingTime[this.recordingTimeCycle].m = 0;
        }
/*        var h = now.getHours() - this.timeMetronomeStarted.getHours() + this.recordingTime.h;
        var m = now.getMinutes() - this.timeMetronomeStarted.getMinutes() + this.recordingTime.m;
          var s = now.getSeconds() - this.timeMetronomeStarted.getSeconds() + this.recordingTime.s;

        let h = this.recordingTime[this.recordingTimeCycle].h + this.recordingTime[this.recordingTimeCycle-1].h;
        let m; // Set later. Check needed for (-1 and 0X)
        let s = this.checkTime(this.recordingTime[this.recordingTimeCycle].s);
        console.log("SECONDS: "+now.getSeconds()+"     //     "+this.recordingTime[this.recordingTimeCycle].s);
        console.log(h + ":" + m + ":" + s);
        if(this.recordingTime[this.recordingTimeCycle].m == -1){
            m = this.checkTime((this.recordingTime[this.recordingTimeCycle].m+1) + this.recordingTime[this.recordingTimeCycle-1].m);
            console.log("HIER EIN M:     "+ m);
        } else {
            m = this.checkTime(this.recordingTime[this.recordingTimeCycle].m + this.recordingTime[this.recordingTimeCycle-1].m);
            console.log("HIER EIN M:   X  "+ m);
        }
        
        this.time = h + ":" + m + ":" + s;
        this.timer = setTimeout(this.continueRecordingTick.bind(this), 500);
        */
    }

    // Start Metronome
    start(type: number){
        this.stop(); // Stop metronome, that's currently running
        
        if(type == 1) {
            this.sessionStartedDate = new Date();
        }

        let sessionRatingContainer = <View>this.sessionRatingContainer.nativeElement;
        let restart = false;

        if(type == 3){
            let that = this;
            dialogs.confirm({
                message: "Reset Timer?",
                okButtonText: "Yes, reset please",
                cancelButtonText: "No!",
            }).then(function (result) {
                if(result){
                    that.button1 = true;
                    that.buttonContainer = false;
                    that.recordingTimeState = true;
                    that.recordingTimeButton = "Stop Recording";
                    sessionRatingContainer.style.visibility = "collapse";

                    that.tick(1);
                }
            });
        } else {
            this.button1 = true;
            this.buttonContainer = false;
            this.recordingTimeState = true;
            this.recordingTimeButton = "Stop Recording";
            sessionRatingContainer.style.visibility = "collapse";
            
            this.tick(type);
        }
    }

    stop() {
        clearTimeout(this.timer);       
    }

    tick(type: number) {
        var interval = 1000; // ms
        var expected = Date.now() + interval;
        let that = this;
        if(type == 1){
            this.time = 0;
            this.timer = setTimeout(tickNew, interval);
        } else if (type == 2){
            this.timer = setTimeout(tickContinue, interval);
        }
        
        function tickNew() {
            var dt = Date.now() - expected; // the drift (positive for overshooting)
            if (dt > interval) {
                // error
            }
            that.time += 1; // TIMER +1 SECOND
            expected += interval;
            that.timer = setTimeout(tickNew, Math.max(0, interval - dt)); // take into account drift
        }

        function tickContinue() {
            var dt = Date.now() - expected; // the drift (positive for overshooting)
            if (dt > interval) {
                // error
            }
            that.time += 1; // TIMER +1 SECOND
            expected += interval;
            that.timer = setTimeout(tickContinue, Math.max(0, interval - dt)); // take into account drift
        }
    }

    ngOnDestroy() {
        // Kill running metronome
        this.stop();
    }

    onRatingStarTap(starPosition) {
        // RESET ALL ICONS TO UNSELECTED;
        for (let i = 0; i < this.ratingIcons.length; i++){
            this.ratingIcons[i].iconCode = String.fromCharCode(0xf006);
            this.ratingIcons[i].iconState = false;
        }
        // DISPLAY SELECTED-ICON until TAPPED STAR POSITION IS REACHED
        for (let i = 0; i < starPosition; i++){
            this.ratingIcons[i].iconCode = String.fromCharCode(0xf005);
            this.ratingIcons[i].iconState = true;
        }
        console.log("STAR POSITION: " + starPosition);
        this.sessionProgressRating = starPosition;
    }

    onSmileTap(smilePosition) {
        this.smileIcons[smilePosition].iconState = !this.smileIcons[smilePosition].iconState;
        if(this.smileIcons[smilePosition].iconState === true) {
            for (let i = 0; i < 3; i++){
                if (smilePosition == 0){
                    this.smileIcons[0].iconState = true;
                    this.smileIcons[1].iconState = false;
                    this.smileIcons[2].iconState = false;
                    this.sessionHappinessRating = 1;
                } else if (smilePosition == 1) {
                    this.smileIcons[0].iconState = false;
                    this.smileIcons[1].iconState = true;
                    this.smileIcons[2].iconState = false;
                    this.sessionHappinessRating = 2;
                } else if (smilePosition == 2) {
                    this.smileIcons[0].iconState = false;
                    this.smileIcons[1].iconState = false;
                    this.smileIcons[2].iconState = true;
                    this.sessionHappinessRating = 3;
                }
            }
        }
    }

    checkTime(i) {
        if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
        return i;
    }

    showPieceDetails(){
        this.showPiece = !this.showPiece;
    }
    
    saveSession(){
        if(this.time > 0) {
            firebase.push(
                '/user/'+BackendService.token+"/practice-session",
                {
                    'duration': this.time,
                    'pieceId': this.routerParamIds['pieceId'],
                    'movementId': this.routerParamIds['movementId'],
                    'userProgressRating': this.sessionProgressRating,
                    'userHappinessRating': this.sessionHappinessRating,
                    'userNotes': this.userSessionNotes,
                    'date': this.sessionStartedDate
                }
            ).then(
                function (result) {
                    dialogs.alert("Session saved! [to Firebase User/Session]").then(()=> {
                        console.log("Dialog closed!");
                    });
                }
            );
        }
    }
}