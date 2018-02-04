import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from "@angular/core";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import { Router } from "@angular/router";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import * as application from "application";
import { BackendService, LoginService } from "../../shared";
import { PageRoute } from "nativescript-angular/router";
import "rxjs/add/operator/switchMap";
import * as Toast from "nativescript-toast";
import { Color } from "color";
import * as dialogs from 'ui/dialogs';
import { ActivatedRoute } from '@angular/router';
// Prompt
import { prompt, PromptResult, inputType } from "ui/dialogs";

const firebase = require("nativescript-plugin-firebase/app");
import { firestore } from "nativescript-plugin-firebase";

@Component({
    selector: "ah-home",
    templateUrl: "pages/home/home.component.html",
    styleUrls: ["pages/home/home-common.css"]
})

export class HomeComponent implements OnInit, OnDestroy {
    isAndroid;
    public actionButtonText: string = "PRACTICE NOW";
    public addPieceIcon = String.fromCharCode(0xf196);
    public pieceListIcon = String.fromCharCode(0xf0ca);

    public routerParamId;

    // Beethoven
    private beethovenMsg;
    private beethovenCmd;
    private settingsIcon = String.fromCharCode(0xf013);
    private settingsButtonUI = String.fromCharCode(0xf013) + "  Settings";

    // UI
    private isAnimating: boolean;
    private beethovenContainerHide: boolean;
    private tutorialTour;
    private username: string;
    private showSettings: boolean;
    private listenerUnsubscribe: () => void;


    // UI LVL (Default: LVL 1)
    private userLvl = 1;
    private xpCurrent = 0;
    private xpCurrentDisplayBar = 4;
    private xpMax = 50;

    @ViewChild("addPieceItem") addPieceItem: ElementRef;
    @ViewChild("pieceListItem") pieceListItem: ElementRef;
    @ViewChild("practiceNowButton") practiceNowButton: ElementRef;
    @ViewChild("practiceSessionItem") practiceSessionItem: ElementRef;
    @ViewChild("beethovenContainer") beethovenContainer: ElementRef;
    @ViewChild("mainContainer") mainContainer: ElementRef;
    @ViewChild("profileContainer") profileContainer: ElementRef;
    @ViewChild("xpProgressBar") xpProgressBar: ElementRef;


    // Deprecated: private _pageRoute: PageRoute
    constructor(private _pageRoute: PageRoute, private _router: Router, private page: Page, 
        private _ngZone: NgZone, private _loginService: LoginService) {
        
        // Show Username (or Email)
        this.username = BackendService.userName || BackendService.email;

        // Listen to Firebase Firestore
        // Load User Info: userLvl: lvl, xpCurrent, xpMax
        this.firestoreListen();

        this.routerParamId = [];
        this.tutorialTour = (BackendService.tutorialTour > 0) ? BackendService.tutorialTour : false;

        this._pageRoute.activatedRoute
        .switchMap(activatedRoute => activatedRoute.params)
        .forEach((params) => { 
            this.routerParamId['noPieces'] = params['noPieces'];
            if(this.routerParamId['noPieces']) {
                console.log("NO PIECES TO PRACTICE!");
            }

            this.routerParamId['optionalParam'] = params['optionalParam'];
            if(this.routerParamId['optionalParam']){
                console.log("PARAM: " + this.routerParamId['optionalParam']);
                switch(this.routerParamId['optionalParam'].substring(0,3)) {
                    case "tos":
                        // toast
                        this.toastManager(this.routerParamId['optionalParam']);
                        break;
                    case "con":
                        // conversation with beethoven
                        this.beethoven(this.routerParamId['optionalParam']);
                        break;
                    case "tcc":
                        if(BackendService.tutorialTour != 0){
                            // COMBINATION: toast & conversation with beethoven
                            // (First Time Tracker Success)
                            this.toastManager("tos-recorder-suc");
                            this.beethoven("con-tracker-suc");
                        }
                        break;
                } 
            } else if(BackendService.tutorialTour > 0) {
                this.beethoven("inherit");
            }
        });  
        
        
    }

    ngOnInit() {
        console.log("Home: OnInit! Tut: " + BackendService.tutorialTour);
        this.isAndroid = !!this.page.android;

        // Hide ActionBar
        this.page.actionBarHidden = true;


        application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
            
        });
    }

    public firestoreListen(): void {
        console.log("FIRESTORE LISTENS: " + BackendService.token);
        if (this.listenerUnsubscribe !== undefined) {
          console.log("Already listening");
          return;
        }
        
        // Define Firestore Piece Document
        let statsCollection = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("stats")
            .orderBy("dateStarted", "desc")
            .limit(1);;

        this.listenerUnsubscribe = statsCollection.onSnapshot((snapshot: firestore.QuerySnapshot) => {
            snapshot.forEach(user => this.handleSnapshot(user));
        });
    }

    public handleSnapshot(user){
        let xpProgressBar = <View>this.xpProgressBar.nativeElement;
        this._ngZone.run(() => {
            if(this.xpCurrent != user.data().xpCurrent) {
                xpProgressBar.animate({
                    opacity: 0,
                    duration: 500
                }).then(() => {
                    this.userLvl = user.data().lvl;
                    this.xpCurrent = user.data().xpCurrent;
                    this.xpMax = user.data().xpMax;

                    // Correcting xpCurrentDisplayBar if xpCurrent Value too low
                    if(this.xpCurrent/this.xpMax < 0.08) {
                        this.xpCurrentDisplayBar = this.xpMax * 0.08;
                    } else {
                        this.xpCurrentDisplayBar = this.xpCurrent;
                    }
                    
                    xpProgressBar.animate({
                        opacity: 1,
                        duration: 500
                    })
                })
            }
        });
    }

    navigateTo(page: string){
        this._router.navigate([page]);
    }

    practiceNow(){
        // if(!BackendService.lastPieceId || BackendService.lastPieceId == -1 || BackendService.lastMovementId == -1){
        //    console.log("No ID found");
        // } else {

            this._router.navigate(["/piece-recorder"]);
        // }
    }

    updateUserName() {
        console.log("UPDATE NAME");
        let options = {
            title: "Edit your Username",
            defaultText: "",
            inputType: inputType.text,
            okButtonText: "Ok",
            cancelButtonText: "Cancel"
        };
        
        prompt(options).then((r: PromptResult) => {
            if(r.result){
                this._loginService.updateName(r.text).then(
                    (result) => {
                        this.username = BackendService.userName;
                        this.showToast("Username successfully changed!");
                    },
                    (error) => {
                        this.showToast("Error while changing username :(");
                    }
                );
            }
        });
        
    }

    toastManager(toastId: string){
        switch(true) {
            case toastId == "tos-recorder-suc":
                if(BackendService.toastLoaded == 1) {
                    this.showToast("Successfully saved Practice-Session!");
                    BackendService.toastLoaded = 0;
                }
                break;
            case toastId == "tos-piece-add-success":
                if(BackendService.toastLoaded == 1) {
                    this.showToast("Piece successfully added to Piece-List!");
                    BackendService.toastLoaded = 0;
                }
                break;
        }
    }

    public showToast(message: string) {
        Toast.makeText(message).show();
    }

    beethoven(command: string){
        console.log("BEETHOVEN TAPPED / TRIGGERED");
        let that = this;

        if(command == "inherit"){
            command = this.beethovenCmd;
        } else if(command == "con-piece-add-success" && BackendService.tutorialTour < 3) {
            BackendService.tutorialTour = 3;
        } else if(command == "con-tracker-suc" && BackendService.tutorialTour < 8) {
            BackendService.tutorialTour = 8;
        } else if(command == "kill"){
            let options = {
                    title: "Mute Beethoven?",
                    message: "Do you want to abort the tutorial?",
                    okButtonText: "Abort Tutorial",
                    cancelButtonText: "No, stay!",
                };
            dialogs.confirm(options).then((result: boolean) => {
                if(result){
                    // Abort
                    this._ngZone.run(() => { 
                        <View>this.beethovenContainer.nativeElement.animate({
                            opacity: 0,
                            duration: 500
                        }).then(() => {
                            this.beethovenMsg = false;
                            this.beethovenCmd = false;
                            this.tutorialTour = false;
                            BackendService.tutorialTour = 0;
                        });
                        <View>this.mainContainer.nativeElement.animate({
                            opacity: 0,
                            duration: 500
                        }).then(() => {
                            <View>this.profileContainer.nativeElement.animate({
                                opacity: 1,
                                duration: 200
                            });
                            <View>this.mainContainer.nativeElement.animate({
                                opacity: 1,
                                duration: 200
                            });
                        });
                    });
                }
            });
            return;
        }

        if(BackendService.tutorialTour != 0){
            this._ngZone.run(() => { 
                switch(BackendService.tutorialTour) {
                    case 0:
                        // Tutorial Done;
                        break;

                    case 1:
                        this.beethovenMsg = "Welcome! I'm Ludwig. I'll show you Apphoven. Just tap on me!";
                        this.beethovenCmd = "con-first-welcome-1";
                        BackendService.tutorialTour++;
                        break;

                    case 2:
                        this.beethovenMsg = "Nice! Let's add a piece to your Practice-List first. Click on the Add-Piece button below.";


                        // pulsateAnimation
                        setTimeout(function() {
                            that.pulsateAnimation("addpiece");
                        }, 1500);
                        break;
                    case 3:
                        this.beethovenMsg = "Well done! Oh, and that's a really nice piece you're practicing right now.";
                        this.beethovenCmd = "con-piece-add-success-1";
                        BackendService.tutorialTour++;
                        break;
                    case 4:
                        this.beethovenMsg = "I added it to your Piece-List. There, you can find informations about your piece, or edit the movements of a work you're currently practicing.";
                        
                        // pulsateAnimation
                        setTimeout(function() {
                            that.pulsateAnimation("piecelist");
                        }, 2300);

                        this.beethovenCmd = "con-piece-add-success-2";
                        BackendService.tutorialTour++;
                        break;
                    case 5:
                        this.beethovenMsg = "If you want to get the most out of Apphoven, you should track your practice sessions.";
                        
                        this.beethovenCmd = "con-piece-add-success-3";
                        BackendService.tutorialTour++;
                        break;
                    case 6:
                        this.beethovenMsg = "Just tap on the big button below, if you are ready...";
                        
                        this.beethovenCmd = "con-piece-add-success-4";
                        BackendService.tutorialTour++;
                        break;
                    case 7:
                        this.beethovenMsg = "... to PRACTICE NOW!";
                        
                        // pulsateAnimation
                        setTimeout(function() {
                            that.pulsateAnimation("practicenow");
                        }, 300);
                        break;

                    case 8:
                        this.beethovenMsg = "Great! Congratulations with your first Apphoven practice session! I saved it to the Practice Session List for you.";
                        
                        // pulsateAnimation
                        setTimeout(function() {
                            that.pulsateAnimation("practicesession");
                        }, 2000);
                        BackendService.tutorialTour++;
                        break;
                    case 9:
                        this.beethovenMsg = "However, that's enough for now. Now it's on you. Explore Apphoven and have fun playing your instrument! I'm going to compose a new piece now.";
                        BackendService.tutorialTour++;
                        break;
                    case 10:
                        <View>this.beethovenContainer.nativeElement.animate({
                            opacity: 0,
                            duration: 500
                        }).then(() => {
                            this.beethovenMsg = false;
                            this.beethovenCmd = false;
                            this.tutorialTour = false;
                            BackendService.tutorialTour = 0;
                        });
                        <View>this.mainContainer.nativeElement.animate({
                            opacity: 0,
                            duration: 500
                        }).then(() => {
                            <View>this.profileContainer.nativeElement.animate({
                                opacity: 1,
                                duration: 200
                            });
                            <View>this.mainContainer.nativeElement.animate({
                                opacity: 1,
                                duration: 200
                            });
                        });
                }
            });
        }
    }

    pulsateAnimation(viewId){
        let view;
        let counter = 0;
        let that = this;

        if(viewId == "addpiece"){
            view = <View>this.addPieceItem.nativeElement;
        } else if(viewId == "piecelist") {
            view = <View>this.pieceListItem.nativeElement;
        } else if(viewId == "practicenow") {
            view = <View>this.practiceNowButton.nativeElement;
        } else if(viewId == "practicesession") {
            view = <View>this.practiceSessionItem.nativeElement;
        }

        if(!this.isAnimating){
            animation();
        }

        function animation() {
            that.isAnimating = true;
            view.animate({
            opacity: 0,
            duration: 200
            }).then(function() {
                view.animate({
                    opacity: 1,
                    duration: 200
                }).then(function() {
                    if(counter <= 5) {
                        counter++;
                        animation();
                    } else {
                        that.isAnimating = false;
                    }
                });
            });
        }
    }

    public firestoreStopListening(): void {
        if (this.listenerUnsubscribe === undefined) {
          console.log("Please start listening first ;)");
          return;
        }
    
        this.listenerUnsubscribe();
        this.listenerUnsubscribe = undefined;
    }

    ngOnDestroy() {
        this.firestoreStopListening();

        // Remove BackPressedEvent Listener
        application.android.off(AndroidApplication.activityBackPressedEvent);
        console.log("Home - ngOnDestroy()");
    }
}