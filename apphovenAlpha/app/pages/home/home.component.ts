import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from "@angular/core";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import { Router } from "@angular/router";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import * as application from "application";
import { BackendService, LoginService, SocialService } from "../../shared";
import { PageRoute, RouterExtensions } from "nativescript-angular/router";
import "rxjs/add/operator/switchMap";
import * as Toast from "nativescript-toast";
import { Color } from "color";
import * as dialogs from 'ui/dialogs';
import { ActivatedRoute } from '@angular/router';

// Prompt
import { prompt, PromptResult, inputType } from "ui/dialogs";

// Lvl-Up-Audio
import { TNSPlayer, AudioPlayerOptions, AudioRecorderOptions } from 'nativescript-audio';


const firebase = require("nativescript-plugin-firebase/app");
import { firestore } from "nativescript-plugin-firebase";
import { TouchGestureEventData, PanGestureEventData, SwipeGestureEventData } from "tns-core-modules/ui/gestures/gestures";

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
    public showSettingsDownIcon = String.fromCharCode(0xf078);
    public showSettingsUpIcon = String.fromCharCode(0xf077);

    public routerParamId;

    // Beethoven
    private beethovenMsg;
    private beethovenCmd;
    private settingsIcon = String.fromCharCode(0xf013);
    private profileIcon = String.fromCharCode(0xf007);
    private moreIcon = String.fromCharCode(0xf0d7);
    private settingsButtonUI = String.fromCharCode(0xf013) + "  Settings";

    // UI
    private isAnimating: boolean;
    private beethovenContainerHide: boolean;
    private tutorialTour;
    private username: string;
    private showSettings: boolean;

    private listenerUnsubscribeStats: () => void;
    private listenerUnsubscribeProfile: () => void;

    // UI News
    private newsArray: Array<any>;

    // UI LVL (Default: LVL 1)
    private userLvl = 1;
    private xpCurrent = 0;
    private xpCurrentDisplayBar = 4;
    private xpMax = 50;

    private displayLvlUpNotification = false;
    private lvlUpBadgeSrc = "res://lvl_badge_10";

    private dragNotificationItem;
    private prevDeltaX: number;
    private prevDeltaY: number;
    private stopAnimation: boolean;

    // UI Friend-Request
    private fRNotificationStatus: number = 0;
    private fRdragNotificationItem;
    private fRprevDeltaX: number;
    private fRprevDeltaY: number;
    private fRstopAnimation: boolean;
    private acceptIcon = String.fromCharCode(0xf05d);
    private denyIcon = String.fromCharCode(0xf05c);
    private friendIcon = String.fromCharCode(0xf007);
    
    // Audio Lvl-Up
    private _player: TNSPlayer;

    @ViewChild("addPieceItem") addPieceItem: ElementRef;
    @ViewChild("pieceListItem") pieceListItem: ElementRef;
    @ViewChild("practiceNowButton") practiceNowButton: ElementRef;
    @ViewChild("practiceSessionItem") practiceSessionItem: ElementRef;
    @ViewChild("beethovenContainer") beethovenContainer: ElementRef;
    @ViewChild("mainContainer") mainContainer: ElementRef;
    @ViewChild("profileContainer") profileContainer: ElementRef;
    @ViewChild("xpProgressBar") xpProgressBar: ElementRef;
    @ViewChild("lvlUpNotification") lvlUpNotification: ElementRef;
    @ViewChild("friendRequestNotification") friendRequestNotification: ElementRef;

    // Deprecated: private _pageRoute: PageRoute
    constructor(private _pageRoute: PageRoute, private _router: Router, private page: Page, 
        private _ngZone: NgZone, private _loginService: LoginService, private _socialService: SocialService,
        private _routerExtensions: RouterExtensions) {
        
        // Init NewsArray
        this.newsArray = [];

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

        // Init Level Up Notification Item
        this.dragNotificationItem = <View>this.lvlUpNotification.nativeElement;
        this.dragNotificationItem.translateX = 0;
        this.dragNotificationItem.translateY = 0;
        this.dragNotificationItem.scaleX = 1;
        this.dragNotificationItem.scaleY = 1

        // Init Friend Request Notification Item
        this.fRdragNotificationItem = <View>this.friendRequestNotification.nativeElement;
        this.fRdragNotificationItem.translateX = 0;
        this.fRdragNotificationItem.translateY = 0;
        this.fRdragNotificationItem.scaleX = 1;
        this.fRdragNotificationItem.scaleY = 1
    }

    public firestoreListen(): void {
        console.log("FIRESTORE LISTENS: " + BackendService.token);
        if (this.listenerUnsubscribeStats !== undefined) {
          console.log("Already listening");
          return;
        } else {
            // Define Firestore Piece Document
            let statsCollection = firebase.firestore()
                .collection("user")
                .doc(BackendService.token)
                .collection("stats")
                .orderBy("dateStarted", "desc")
                .limit(1);

            this.listenerUnsubscribeStats = statsCollection.onSnapshot((snapshot: firestore.QuerySnapshot) => {
                snapshot.forEach(user => this.handleSnapshotStats(user));
            });
        }

        if (this.listenerUnsubscribeProfile !== undefined) {
            console.log("Already listening");
            return;
        } else {
            // Define Firestore Piece Document
            let newsCollection = firebase.firestore()
                .collection("user")
                .doc(BackendService.token)
                .collection("news")
                .orderBy("date", "desc")
                .limit(10);

            this.listenerUnsubscribeStats = newsCollection.onSnapshot((snapshot: firestore.QuerySnapshot) => {
                snapshot.forEach(newsEntry => this.handleSnapshotNewsEntry(newsEntry));
            });
        }
    }

    public handleSnapshotStats(user){
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
                    this.displayLvlUpNotification = user.data().displayLvlUpNotification;
                    this.dragNotificationItem.opacity = 1;
                    // Reposition lvlUpNotification to default
                    this.dragNotificationItem.deltaX = 0;
                    this.stopAnimation = false;

                    if(this.displayLvlUpNotification) {
                        this.handleLvlUp();
                    }

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

    public handleSnapshotNewsEntry(newsEntry){
        if(newsEntry.data().type == "friendrequest"){
            console.log("NEW FRIEND REQUEST!");
            this._ngZone.run(() => {
                this.newsArray.push({
                    type: newsEntry.data().type,
                    friendRequestName: newsEntry.data().friendRequestName || "",
                    friendRequestEmail: newsEntry.data().friendRequestEmail,
                    senderId: newsEntry.data().senderId
                });
            });
        } else {
            console.log("NO FRIEND REQUESTS");
        }
    }

    /* 
     * LVL-UP (& LVL-UP NOTIFICATION)
     */ 

    handleLvlUp() {
        this.animateLvlUp(6, 500);

        // Set BadgeSrc according to userLvl
        if(this.userLvl < 20) {
            this.lvlUpBadgeSrc = "res://lvl_badge_10";
        } else if (this.userLvl >= 20 && this.userLvl < 30) {
            this.lvlUpBadgeSrc = "res://lvl_badge_20";
        } else if (this.userLvl >= 30 && this.userLvl < 40) {
            this.lvlUpBadgeSrc = "res://lvl_badge_30";
        } else if (this.userLvl >= 40 && this.userLvl < 50) {
            this.lvlUpBadgeSrc = "res://lvl_badge_40";
        } else if (this.userLvl >= 50 && this.userLvl < 60) {
            this.lvlUpBadgeSrc = "res://lvl_badge_50";
        } else if (this.userLvl >= 60 && this.userLvl < 70) {
            this.lvlUpBadgeSrc = "res://lvl_badge_60";
        } else if (this.userLvl >= 70 && this.userLvl < 80) {
            this.lvlUpBadgeSrc = "res://lvl_badge_70";
        } else if (this.userLvl >= 80 && this.userLvl < 90) {
            this.lvlUpBadgeSrc = "res://lvl_badge_80";
        } else if (this.userLvl >= 90 && this.userLvl < 99) {
            this.lvlUpBadgeSrc = "res://lvl_badge_90";
        }  else if (this.userLvl >= 99) {
            this.lvlUpBadgeSrc = "res://lvl_badge_99";
        }

        // Do not play audio if user switched off setting
        if(BackendService.playLvlUp === undefined || BackendService.playLvlUp == true) {
            // Lvl-Up Audio Player
            this._player = new TNSPlayer();
            // this._player.volume = 0.5;
            // this._player.debug = true; // set true to enable TNSPlayer console logs for debugging.
            this._player
            .playFromFile({
                audioFile: 'https://data.apphoven.com/lvl-up-sounds/lvl' + this.userLvl + ".mp3",
                loop: false,
                completeCallback: this._trackComplete.bind(this),
                errorCallback: this._trackError.bind(this)
            });
        }
            
    }

    // Lvl-Up Audio Player

    /* public togglePlay() {
        if (this._player.isAudioPlaying()) {
            this._player.pause();
        } else {
            this._player.play();
        }
    }*/
    
    private _trackComplete(args: any) {
        this._player.dispose();
        console.log('reference back to player:', args.player);
    }
    
    private _trackError(args: any) {
        console.log('reference back to player:', args.player);
        console.log('the error:', args.error);
        // Android only: extra detail on error
        console.log('extra info on the error:', args.extra);
    }

    // -/- Lvl-Up Audio Player -/-


    animateLvlUp(repeatAmount: number, duration: number){
        console.log("ANIMATE... " + repeatAmount);
        // Blue
        <View>this.lvlUpNotification.nativeElement.animate({
            backgroundColor: new Color("#3D5AFE"),
            duration: duration
        }).then(() => {
            // Red
            <View>this.lvlUpNotification.nativeElement.animate({
                backgroundColor: new Color("#E95D59"),
                duration: duration
            }).then(() => {
                // Repeat?
                if(!this.stopAnimation){
                    if(repeatAmount < 4 && repeatAmount > 0){
                        // Slow down last 3 loops
                        this.animateLvlUp(repeatAmount-1, 1000);
                    } else if(repeatAmount > 0){
                        this.animateLvlUp(repeatAmount-1, 500);
                    };
                }
            });
        });
    }

    onLvlUpNotificationPan(args: PanGestureEventData) {
        if (args.state === 1) // down
        {   
            this.stopAnimation = true;
            this.prevDeltaX = 0;
            this.prevDeltaY = 0;
        }
        else if (args.state === 2) // panning
        {
            this.dragNotificationItem.translateX += args.deltaX - this.prevDeltaX;
            // this.dragNotificationItem.translateY += args.deltaY - this.prevDeltaY;

            console.log(this.dragNotificationItem.translateX);

            this.prevDeltaX = args.deltaX;
            this.prevDeltaY = args.deltaY;

            if(this.dragNotificationItem.translateX > 120) {
                // Attention: You're about to dismiss the notification
                <View>this.lvlUpNotification.nativeElement.animate({
                    opacity: 0.5,
                    duration: 100
                });
            } else {
                <View>this.lvlUpNotification.nativeElement.animate({
                    opacity: 1,
                    duration: 100
                })
            }

        }
        else if (args.state === 3) // up
        {
            if(this.dragNotificationItem.translateX > 120) {

                // Dismiss Notifiaction
                <View>this.lvlUpNotification.nativeElement.animate({
                    translate: { x: 500, y: 0},
                    duration: 400
                }).then(() => {
                    // Reset nativeElement to default position
                    // Is there a better way to reset than use animate()?
                    <View>this.lvlUpNotification.nativeElement.animate({
                        translate: { x: 0, y: 0},
                        duration: 10
                    });
                });
                <View>this.lvlUpNotification.nativeElement.animate({
                    opacity: 0,
                    duration: 400
                }).then(() => {
                    // Reset dragNotificationItem to default
                    this.dragNotificationItem.opacity = 1;
                    this.dragNotificationItem.translateX = 0;
                    // Hide Notification
                    this.displayLvlUpNotification = false;
                    //this.lvlUpNotification.nativeElement.visibility = "collapse";
                });

                this.lvlUpNotificationDone();


            } else {
                <View>this.lvlUpNotification.nativeElement.animate({
                    translate: { x: 0, y: 0},
                    duration: 100
                }).then(() => {
                    this.dragNotificationItem.translateX = 0;
                });
            }
        }
    }

    lvlUpNotificationDone(){
        if(this._player) {
            console.log("Dispose Audio");
            this._player.dispose();
        }

        const statsEntry = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("stats")
            .doc(""+this.userLvl);

        statsEntry.update({
            displayLvlUpNotification: false
        }).then(() => {
            console.log("LVL-UP-Notification marked as read");
        });
    }

    /* --/-- LVL-UP NOTIFICATION --/-- */


    onFriendRequestPan(args: PanGestureEventData) {
        if (args.state === 1) // down
        {   
            this.fRstopAnimation = true;
            this.fRprevDeltaX = 0;
            this.fRprevDeltaY = 0;
        }
        else if (args.state === 2) // panning
        {
            this.fRdragNotificationItem.translateX += args.deltaX - this.fRprevDeltaX;
            // this.dragNotificationItem.translateY += args.deltaY - this.prevDeltaY;

            this.fRprevDeltaX = args.deltaX;
            this.fRprevDeltaY = args.deltaY;

            if(this.fRdragNotificationItem.translateX > 120) {

                // fRNotificationStatus = 1, ACCEPT REQUEST
                this.fRNotificationStatus = 1;
                this.friendRequestNotification.nativeElement.style.backgroundColor = new Color("green");

            } else if (this.fRdragNotificationItem.translateX < -120) {

                // fRNotificationStatus = 1, DENY REQUEST
                this.fRNotificationStatus = 2;
                this.friendRequestNotification.nativeElement.style.backgroundColor = new Color("gray");
            
            } else {
                // fRNotificationStatus = 0, DO NOTHING
                this.fRNotificationStatus = 0;
                this.friendRequestNotification.nativeElement.style.backgroundColor = new Color("#E95D59");
            }

        }
        else if (args.state === 3) // up
        {
            if(this.fRdragNotificationItem.translateX > 120) {

                // ACCEPT FRIEND
                let friendName = this.newsArray[0].friendRequestName || this.newsArray[0].friendRequestEmail;
                this._socialService.acceptFriend(this.newsArray[0].senderId, friendName).then(() => {
                    this.showToast("Friend added!");
                });
                
                <View>this.friendRequestNotification.nativeElement.animate({
                    translate: { x: 500, y: 0},
                    duration: 500
                }).then(() => {
                    // Reset nativeElement to default position
                    // Is there a better way to reset than use animate()?
                    <View>this.friendRequestNotification.nativeElement.animate({
                        translate: { x: 0, y: 0},
                        duration: 10
                    });
                });
                <View>this.friendRequestNotification.nativeElement.animate({
                    opacity: 0,
                    duration: 400
                }).then(() => {
                    // Reset fRdragNotificationItem to default
                    this.fRdragNotificationItem.opacity = 1;
                    this.fRdragNotificationItem.translateX = 0;
                    this.friendRequestNotification.nativeElement.style.backgroundColor = new Color("#E95D59");
                    // Remove Friend-Request from local newsArray
                    this.newsArray.shift();
                    // Hide Background-UI
                    this.fRNotificationStatus = 0;
                });

            } else if (this.fRdragNotificationItem.translateX < -120) {

                // DENY FRIEND
                this._socialService.denyFriend(this.newsArray[0].senderId).then(() => {
                    this.showToast("Dismissed Friend-Request!");
                });

                <View>this.friendRequestNotification.nativeElement.animate({
                    translate: { x: -500, y: 0},
                    duration: 500
                }).then(() => {
                    // Reset nativeElement to default position
                    // Is there a better way to reset than use animate()?
                    <View>this.friendRequestNotification.nativeElement.animate({
                        translate: { x: 0, y: 0},
                        duration: 10
                    });
                });
                <View>this.friendRequestNotification.nativeElement.animate({
                    opacity: 0,
                    duration: 400
                }).then(() => {
                    // Reset fRdragNotificationItem to default
                    this.fRdragNotificationItem.opacity = 1;
                    this.fRdragNotificationItem.translateX = 0;
                    this.friendRequestNotification.nativeElement.style.backgroundColor = new Color("#E95D59");
                    // Remove Friend-Request from local newsArray
                    this.newsArray.shift();
                    // Hide Background-UI
                    this.fRNotificationStatus = 0;
                });

            } else {

                // RESET TO DEFAULT LOCATION
                <View>this.friendRequestNotification.nativeElement.animate({
                    translate: { x: 0, y: 0},
                    duration: 100
                }).then(() => {
                    this.fRdragNotificationItem.translateX = 0;
                });
            }
        }
    }

    navigationSwipe(args: SwipeGestureEventData) {
        if(args.direction == 2) {
            this.navigateTo('profile', true);
        }
    }

    navigateTo(page: string, transition?: boolean){
        if(transition){
            this._routerExtensions.navigate([page], {
                transition: {
                    name: "slideLeft",
                    duration: 150,
                    curve: "easeIn"
                }
            });
        } else {
            this._router.navigate([page]);
        }
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
        if (this.listenerUnsubscribeStats === undefined) {
            console.log("Please start listening first ;)");
            return;
        } else {
            this.listenerUnsubscribeStats();
            this.listenerUnsubscribeStats = undefined;
        }

        if (this.listenerUnsubscribeProfile === undefined) {
            console.log("Please start listening first ;)");
            return;
        } else {
            this.listenerUnsubscribeProfile();
            this.listenerUnsubscribeProfile = undefined;
        }
    }

    ngOnDestroy() {
        this.firestoreStopListening();

        // Remove BackPressedEvent Listener
        application.android.off(AndroidApplication.activityBackPressedEvent);
        console.log("Home - ngOnDestroy()");
    }
}