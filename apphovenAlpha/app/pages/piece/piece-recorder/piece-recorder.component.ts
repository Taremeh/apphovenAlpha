import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from "@angular/core";
import { setInterval, setTimeout, clearInterval } from "timer";
import { PageRoute } from "nativescript-angular/router";
import { View } from "ui/core/view";
import { Color } from "color";
import { Page } from "ui/page";

const firebase = require("nativescript-plugin-firebase/app");
import { firestore } from "nativescript-plugin-firebase";

import { BackendService, TimerPipe, PieceService } from "../../../shared";
import { Observable as RxObservable } from 'rxjs/Observable';
import dialogs = require("ui/dialogs");
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import * as application from "application";
import { RouterExtensions } from "nativescript-angular/router";
import { Router } from "@angular/router";
import * as Toast from "nativescript-toast";

declare var android;


@Component({
    selector: "ah-piece-recorder",
    templateUrl: "pages/piece/piece-recorder/piece-recorder.component.html",
    styleUrls: ["pages/piece/piece-recorder/piece-recorder-common.css"]
})
export class PieceRecorderComponent implements OnInit, OnDestroy {
    
    // OnInit
    private noPiecesFound: boolean = false;

    public timer: number; // Timeout Var
    public time: number = 0; // Passed Time in sec

    public ratingIcons: Array<any>; // Rating-Star-Icons
    public smileIcons: Array<any>; // Smile-Icons

    // Recording-Time Button Text & State
    public recordingTimeButton: string = "Record Session";
    public recordingTimeState: boolean = false;
    public recordingAutoStart: boolean = false;

    // Button & Button-Container States
    public button1: boolean = true;
    public buttonContainer: boolean = false;

    public userSessionNotes: string; // User Notes

    public sessionProgressRating: number; // User Rating (1-5)
    public sessionHappinessRating: number; // User Rating (1 / 2 / 3)

    public showPieceMeta: boolean = false;

    public myItems: RxObservable<Array<any>>;

    public pieceMovementArray: Array<any>;
    public pieceMovementArrayNotSelected: Array<any>;
    public pieceTitle;
    public pieceWorkNumber;
    public movementTitle;
    public sessionStartedDate;

    // UI
    private selectPieceInfo: string = "Select the piece you've practiced:";

    // After Recording: Piece Selection
    public selectionPieceArray: Array<any>;
    public selectionPieceIds: Array<any>;
    public selectionPieceMovements: Array<any>;
    public autoselectPiece: Array<any>;
    public selectedPieceId;
    public selectedMovementId;
    public selectMultiplePiecesState: boolean = false;
    
    private selectedPieceMovementTitle: string;

    public currentView: number = 0;

    // Observable
    private listenerUnsubscribe: () => void;

    constructor(private _page: Page, private _ngZone: NgZone, private _pieceService: PieceService, 
    private _routerExtensions: RouterExtensions, private _router: Router){

        console.log("CONSTRUCTOR");
        // this.routerParamIds = [];

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

        // this.loadPieceInformation();

        // CHANGE STATUS-BAR COLOR
        // let window = application.android.foregroundActivity.getWindow();
        // window.setStatusBarColor(new Color("#1c1c1c").android);
    }

    @ViewChild("sessionRatingContainer") sessionRatingContainer: ElementRef;
    @ViewChild("pieceSelectionContainer") pieceSelectionContainer: ElementRef;
    @ViewChild("pieceSelectionCheckbox") pieceSelectionCheckbox: ElementRef;


    ngOnInit() {
        this._page.actionBarHidden = true;

        // Create onBackButtonPressed-Listener
        application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
            console.log("BACK BUTTON EVENT TRIGGERED");
            this.backEvent(data);
        });
    }

    toggleRecordingTime(){
        let sessionRatingContainer = <View>this.sessionRatingContainer.nativeElement;
        let pieceSelectionContainer = <View>this.pieceSelectionContainer.nativeElement;

       if(this.recordingTimeState){
           this.firestoreListen();
            // this.loadPieceInformation();
            pieceSelectionContainer.style.visibility = "visible";
            this.button1 = false;
            this.buttonContainer = true;

            this.recordingTimeState = false;
            this.recordingTimeButton = "Restart";
            this.stop();
            BackendService.practiceTimestampBackup = 0;
        } else {
            pieceSelectionContainer.style.visibility = "collapse";

            this.recordingTimeState = true;
            this.recordingTimeButton = "Stop Recording";
            /*

            Practice-Time Retriever (Future Update)
            if(BackendService.practiceTimeBackup != 0){
                this.start(2);
                console.log("HALLO")
            } else {
                this.start(1);
            }
            */
            
            this.start(1);
        }
    }

    // Start Metronome
    start(type: number){
        console.log("TEST TEST TEST");
        this.stop(); // Stop metronome, that's currently running
        
        if(type == 1) {
            this.sessionStartedDate = new Date().getTime();
        } /*

        Practice-Time Retriever (Future Update)
        
        else if(type == 2){
            if(BackendService.practiceTimestampBackup != 0){
                this.sessionStartedDate = BackendService.practiceTimestampBackup - (BackendService.practiceTimeBackup*1000);
            }
        } */

        let sessionRatingContainer = <View>this.sessionRatingContainer.nativeElement;
        let pieceSelectionContainer = <View>this.pieceSelectionContainer.nativeElement;
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
                    pieceSelectionContainer.style.visibility = "collapse";
                    sessionRatingContainer.style.visibility = "collapse";

                    that.tick(1);
                    that.selectMultiplePiecesState = false;
                }
            });
        } else {
            this.button1 = true;
            this.buttonContainer = false;
            this.recordingTimeState = true;
            this.recordingTimeButton = "Stop Recording";
            pieceSelectionContainer.style.visibility = "collapse";
            
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
        } /*
        Practice-Time Retriever (Future Update)
        
        else if (type == 4){
            this.time = this.time
            this.timer = setTimeout(tickContinue, interval);
        }*/
        
        function tickNew() {
            var dt = Date.now() - expected; // the drift (positive for overshooting)
            if (dt > interval) {
                // error
            }
            that.time += 1; // TIMER +1 SECOND
            expected += interval;
            that.timer = setTimeout(tickNew, Math.max(0, interval - dt)); // take into account drift
            
            // Save Practice-Time as Backup
            BackendService.practiceTimeBackup = that.time;
        }

        function tickContinue() {
            var dt = Date.now() - expected; // the drift (positive for overshooting)
            if (dt > interval) {
                // error
            }
            that.time += 1; // TIMER +1 SECOND
            expected += interval;
            that.timer = setTimeout(tickContinue, Math.max(0, interval - dt)); // take into account drift

            // Save Practice-Time as Backup
            BackendService.practiceTimeBackup = that.time;
        }
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

    onSelectionSmileTap(piece) {
        if(piece.state) {
            if(piece.iconState == -1  || piece.iconState == 1){
                // FIRST TIME TOUCHED -> SET TO HAPPY
                // OR: iconState WAS NEUTRAL
                piece.iconState = 2;
                piece.iconCode = String.fromCharCode(0xf118);
                piece.iconColor = "#8BF287";
            } else if (piece.iconState == 2) {
                // SECOND TIME TOUCHED -> SET TO SAD
                piece.iconState = 0;
                piece.iconCode = String.fromCharCode(0xf119);
                piece.iconColor = "#FF6961";
            } else if (piece.iconState == 0) {
                // THIRD TIME TOUCHED -> SET TO NEUTRAL
                piece.iconState = 1;
                piece.iconCode = String.fromCharCode(0xf11a);
                piece.iconColor = "#F2CE59";
            }
        } else {
            // NOTIFY: PLEASE USE SLIDER FIRST!
            // (Add Toast-Notification)?
            this.showToast("First, use the slider");
        }
    }

    sliderValueChanged(piece) {
        console.log("SL VAL: " + piece.durationSliderValue);
        if(!piece.state){
            piece.iconColor = "#F9F9F9";
            piece.state = true;
        }
    }

    checkTime(i) {
        if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
        return i;
    }

    onPieceTap(piece) {
        if(!this.selectMultiplePiecesState) {
            this.currentView = 1;


            let sessionRatingContainer = <View>this.sessionRatingContainer.nativeElement;
            let pieceSelectionContainer = <View>this.pieceSelectionContainer.nativeElement;

            this.buttonContainer = false;
            pieceSelectionContainer.style.visibility = "collapse";
            sessionRatingContainer.style.visibility = "visible";

            console.log("PIECE ID FOR FIREBASE: " + piece.pieceId);
            this.selectedPieceId = piece.pieceId;
            this.selectedPieceMovementTitle = piece.pieceTitle;

            if(piece.movementId != null) {
                this.selectedPieceMovementTitle = piece.movementTitle + " | " + piece.pieceTitle;
                this.selectedMovementId = piece.movementId;
            } else {
                this.selectedMovementId = -1;
            }

        } else {
            if(piece.state == 1) {
                console.log("STATE 0");
                piece.state = 0;
            } else {
                console.log("STATE 1");
                piece.state = 1;
            }
        }
    }

    activateMultiplePieceSelection() {
        this.buttonContainer = false;
        this.currentView = 1;
        this.selectMultiplePiecesState = true;
        this.selectPieceInfo = "Use the slider to define how much you practice each piece";
        console.log(this.selectMultiplePiecesState);
    }

    public firestoreListen(): void {
        if (this.listenerUnsubscribe !== undefined) {
          console.log("Already listening");
          return;
        }
        
        // Define Firestore Collection
        let pieceCollection = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("piece");

        // Define Firestore Query
        let query = pieceCollection
            .orderBy("dateAdded", "desc");

        this.listenerUnsubscribe = query.onSnapshot((snapshot: firestore.QuerySnapshot) => {
            if (snapshot) {
                console.log("Handling Snapshot");
                this.handleSnapshot(snapshot);
            } else {
                console.log("No Pieces Found!");
            }
        });
    }

    public handleSnapshot(snapshot){
        this.selectionPieceArray = [];
        // Check if Snapshot contains Pieces (snapshot.docsSnapshots: [])
        if(snapshot.docSnapshots.length !== 0){
            this.noPiecesFound = false;
            console.log("PIECE-ITEMS FOUND");
            snapshot.forEach(piece => {
                console.log("The Result: " + JSON.stringify(piece) + "\n\n");
                console.log("> PIECE SUCCESSFULLY RETRIEVED.");
                console.log(">> Analysing Data \n");
                console.log(">>> Piece ID: " + piece.id);
                console.log(">>> Piece Value: " + JSON.stringify(piece.data()));
                piece.data().movementItem ? console.log(">>> Movements: " + JSON.stringify(piece.data().movementItem.length) + "\n\n") : console.log(">>> Movements: 0\n\n");
            
                // Maintenance: Implement function to directly retrieve composerName
                // let composerName;
            
                if(piece.data().movementItem){
                    // Piece contains Movements
                    console.log("MOVEMENT-ITEMS FOUND");

                    // Count Movements of Pieced
                    let movementAmount = piece.data().movementItem.length;

                    // Add each movement (with practice state = 1) of piece to selectionPieceArray
                    for (let iMov = 0; iMov < movementAmount; iMov++) {
                        if(piece.data().movementItem[iMov].state == 1){
                            this._ngZone.run(() => {
                                this.selectionPieceArray.push({
                                    pieceId: piece.id,
                                    movementId: piece.data().movementItem[iMov].id,
                                    pieceTitle: piece.data().pieceTitle,
                                    movementTitle: piece.data().movementItem[iMov].title,
                                    lastUsed: piece.data().movementItem[iMov].lastUsed,
                                    iconCode: String.fromCharCode(0xf11a), 
                                    iconState: -1,
                                    iconColor: "#afafaf",
                                    durationSliderValue: 0,
                                    state: false
                                });
                            })
                        }
                    }
                    
                } else {
                    // Piece does not contain movements
                    // Add piece to selectionPieceArray
                    this._ngZone.run(() => {
                        this.selectionPieceArray.push({
                            pieceId: piece.id,
                            pieceTitle: piece.data().pieceTitle,
                            lastUsed: piece.data().lastUsed,
                            iconCode: String.fromCharCode(0xf11a), 
                            iconState: -1,
                            iconColor: "#afafaf",
                            durationSliderValue: 0,
                            state: false
                        });
                    });
                }
            });

            this._ngZone.run(() => {
                // Sort array by lastUsed. Last Used at the top
                this.selectionPieceArray.sort(function(a, b) {
                    return parseFloat(b.lastUsed) - parseFloat(a.lastUsed);
                });
            });

        } else {
            // No Pieces Found
            this._ngZone.run(() => {
                this.noPiecesFound = true;
                console.log("NO PIECES FOUND");
            });
        }
    }
    
    saveSession(){
        if(this.time > 0) {
            let that = this;

            // Define Firestore Collection
            const practiceSessionCollection = firebase.firestore()
                .collection("user")
                .doc(BackendService.token)
                .collection("practice-session");
            
            // Save Practice Session
            practiceSessionCollection.doc(String(this.sessionStartedDate)).set({
                'duration': this.time,
                'pieceMovementTitle': this.selectedPieceMovementTitle,
                'pieceId': this.selectedPieceId, // this.routerParamIds['pieceId'],
                'movementId': this.selectedMovementId, // this.routerParamIds['movementId'],
                'userProgressRating': this.sessionProgressRating,
                'userHappinessRating': this.sessionHappinessRating,
                'userNotes': this.userSessionNotes,
                'date': this.sessionStartedDate,
                'id': this.sessionStartedDate
            }).then(
                function (result) {
                    // BackendService: Update lastPieceId & lastMovementId (DEL)
                    // BackendService.lastPieceId = Number(that.routerParamIds['pieceId']);
                    // BackendService.lastMovementId = Number(that.routerParamIds['movementId']);

                    // REDIRECTION 
                    if(BackendService.tutorialTour > 1){
                        // Tutorial Tour
                        BackendService.toastLoaded = 1;
                        that._routerExtensions.navigate(["/home/tcc-recorder-suc"], { clearHistory: true });
                    } else {
                        // Regular
                        BackendService.toastLoaded = 1;
                        that._routerExtensions.navigate(["/home/tos-recorder-suc"], { clearHistory: true });
                    }
                }
            );
        } else {
            this.showToast("Please practice more than 0 seconds");
        }
    }

    saveMultipleSessions(){
        let sliderValueTotal: number = 0;
        for (let i = 0; i < this.selectionPieceArray.length; i++) {
            if(this.selectionPieceArray[i].durationSliderValue > 0) {
                sliderValueTotal +=this.selectionPieceArray[i].durationSliderValue;
            }
        }
        console.log("SLIDER TOTAL: " + sliderValueTotal);
        if(sliderValueTotal > 0){

            // Counter needed to append to session id (date-id)
            let iSavedSession = -1;

            for (let i = 0; i < this.selectionPieceArray.length; i++) {
                if(this.selectionPieceArray[i].durationSliderValue > 0) {
                    let duration = Math.round(this.time / sliderValueTotal * this.selectionPieceArray[i].durationSliderValue);
                    let userHappiness = this.selectionPieceArray[i].iconState == -1 ? null : this.selectionPieceArray[i].iconState+1;
                    let pieceMovementTitle;

                    if(this.selectionPieceArray[i].movementId != null) {
                        pieceMovementTitle = this.selectionPieceArray[i].movementTitle + " | " + this.selectionPieceArray[i].pieceTitle;
                    } else {
                        pieceMovementTitle = this.selectionPieceArray[i].pieceTitle;
                    }

                    if(duration != 0){
                        // Practice-Session will definitely be stored, therefore +iSavedSession 
                        ++iSavedSession;

                        // Define Firestore Collection
                        const practiceSessionCollection = firebase.firestore()
                            .collection("user")
                            .doc(BackendService.token)
                            .collection("practice-session");
                        
                        // Save Practice Session
                        practiceSessionCollection.doc(String(this.sessionStartedDate)+"-"+iSavedSession).set({
                            'duration': duration,
                            'pieceMovementTitle': pieceMovementTitle,
                            'pieceId': this.selectionPieceArray[i].pieceId, // this.routerParamIds['pieceId'],
                            'movementId': this.selectionPieceArray[i].movementId, // this.routerParamIds['movementId'],
                            'userProgressRating': null,
                            'userHappinessRating': userHappiness,
                            'userNotes': null,
                            'date': this.sessionStartedDate,
                            'id': this.sessionStartedDate+"-"+iSavedSession
                        }).then(
                            function (result) {
                                // BackendService: Update lastPieceId & lastMovementId
                                console.log("Session " + iSavedSession + " saved");
                            }
                        );
                    } else {
                        this.showToast("Please practice more than 0 seconds");
                    }
                }
            }
            // REDIRECTION
            if(BackendService.tutorialTour > 1){
                // Tutorial Tour
                BackendService.toastLoaded = 1;
                this._routerExtensions.navigate(["/home/tcc-recorder-suc"], { clearHistory: true });
            } else {
                // Regular
                BackendService.toastLoaded = 1;
                this._routerExtensions.navigate(["/home/tos-recorder-suc"], { clearHistory: true });
            }
        } else {
            this.showToast("Please use the sliders to distribute your pracitce time");
        }
    }

    backEvent(args) {
        if(this.currentView == 0){
            /*
            Practice-Time Retriever (Future Update)

            if(this.recordingTimeState){
                let date = new Date();
                let dateBackup = date.getTime();
                BackendService.practiceTimestampBackup = dateBackup;
                console.log("SAVED STAMP: " + BackendService.practiceTimestampBackup);
            } else {
                BackendService.practiceTimestampBackup = 0;
            }

            */
            return;
        } else {
            args.cancel = true;
        }

        if(this.currentView == 1 && this.selectMultiplePiecesState === true){
            this._ngZone.run(() => {
                this.currentView -= 1;
                this.selectMultiplePiecesState = false;
                this.buttonContainer = true;
                this.selectPieceInfo = "Select the piece you've practiced:";
            })

        } else if(this.currentView == 1) {
            // IF ONE-PIECE-RATING (1b), THEN BACK TO SELECTION (0)
            this.currentView -= 1;
            let sessionRatingContainer = <View>this.sessionRatingContainer.nativeElement;
            let pieceSelectionContainer = <View>this.pieceSelectionContainer.nativeElement;

            // SHOW BUTTONS (RESET / CONTINUE) AGAIN
            this._ngZone.run(() => {
                this.buttonContainer = true;
            });  

            
            sessionRatingContainer.style.visibility = "collapse";
            pieceSelectionContainer.style.visibility = "visible";

        }
    }

    public showToast(message: string) {
        Toast.makeText(message).show();
    }

    public firestoreStopListening(): void {
        if (this.listenerUnsubscribe === undefined) {
          console.log("Please start listening first.");
          return;
        }
    
        this.listenerUnsubscribe();
        this.listenerUnsubscribe = undefined;
    }

    ngOnDestroy() {
        // Stop Firestore Listening
        this.firestoreStopListening();

        // Remove BackPressedEvent Listener
        application.android.off(AndroidApplication.activityBackPressedEvent);
        console.log("PieceRecorder - ngOnDestroy()");

        // Stop running recorder
        this.stop();
    }
}