import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Page } from "ui/page";
import { BackendService, LevelService } from "../../shared";
import { RouterExtensions } from "nativescript-angular/router";

let utilityModule = require("utils/utils");
const platformModule = require("tns-core-modules/platform");

// Prompt & Toast
import { prompt, PromptResult, inputType } from "ui/dialogs";
import * as Toast from "nativescript-toast";

// Background Service
/* var Observable = require("data/observable").Observable;
var application = require("application");
import * as utils from "utils/utils"; */

const firebase = require("nativescript-plugin-firebase");
const firebasestore = require("nativescript-plugin-firebase/app");
import { firestore } from "nativescript-plugin-firebase";


import { Switch } from "tns-core-modules/ui/switch/switch";

@Component({
    selector: "ah-settings",
    templateUrl: "pages/settings/settings.component.html",
    styleUrls: ["pages/settings/settings-common.css"],
})

export class SettingsComponent implements OnInit, OnDestroy {
    isAndroid;
    private userEmail;
    private tapCounter = 0;
    public playLvlUpSetting: boolean = false;

    public contactIcon = String.fromCharCode(0xf0e0);

    constructor(private _router: Router, private page: Page, private _routerExtensions: RouterExtensions, private _lvlService: LevelService) { 

        firebase.getCurrentUser().then((user) => {
            this.userEmail = user.email;
            console.log("User uid: " + user.uid);
        }, (error) => {
            console.log("Firebase User Email not Found: " + error);
        });

        // If User visiting Settings first time, set playLvlUp to default: true
        console.log("playLvlUp: " + BackendService.playLvlUp);
        if(BackendService.playLvlUp === undefined || BackendService.playLvlUp == true){
            console.log("playLvlUp UNDEFINED / TRUE: " + BackendService.playLvlUp);
            this.playLvlUpSetting = true;
            // BackendService.playLvlUp = true;
        } else {
            this.playLvlUpSetting = false;
        }

    }

    ngOnInit() {
        console.log("Registiert: OnInit");
        this.isAndroid = !!this.page.android;
        this.page.actionBarHidden = false;
    }

    switchChanged(args) {
        let playLvlUpSwitch = <Switch>args.object;
        if (playLvlUpSwitch.checked) {
            this.playLvlUpSetting = true
            BackendService.playLvlUp = true;
        } else {
            this.playLvlUpSetting = false;
            BackendService.playLvlUp = false;
        }
    }

    contact(){
        let options = {
            title: "Sumbit issue",
            message: "Sumbit bugs, problems, ideas, questions. The developer will answer you via your E-Mail (" + BackendService.email + ").",
            inputType: inputType.text,
            okButtonText: "Sumbit",
            cancelButtonText: "Cancel"
        };
        
        prompt(options).then((r: PromptResult) => {
            if(r.result){
                let date = Date.now();
                let supportCollection = firebasestore.firestore()
                    .collection("support")
                    .doc(BackendService.token)
                    .collection("userContact");

                supportCollection.doc(String(date)).set({
                    user: BackendService.token,
                    dateSubmitted: date,
                    userInput: r.text,
                    backendService: {
                        playLvlUp: BackendService.playLvlUp,
                        email: BackendService.email,
                        userName: BackendService.userName,
                        tutorialTour: BackendService.tutorialTour
                    },
                    deviceInfo: {
                        deviceModel: platformModule.device.model,
                        deviceType: platformModule.device.deviceType,
                        deviceOs: platformModule.device.os,
                        deviceOsVersion: platformModule.device.osVersion,
                        deviceSdkVersion: platformModule.device.sdkVersion,
                        deviceLanguage: platformModule.device.language,
                        deviceManufacturer: platformModule.device.manufacturer,
                        deviceUuid: platformModule.device.uuid,
                        screenHeightDIP: platformModule.screen.mainScreen.heightDIPs,
                        screenHeightPixel: platformModule.screen.mainScreen.heightPixels,
                        screenHeightScale: platformModule.screen.mainScreen.scale,
                        screenWidthDIP: platformModule.screen.mainScreen.widthDIPs,
                        screenWidthPixel: platformModule.screen.mainScreen.widthPixels
                    }
                }).then(() => {
                    this.showToast("Developer is informed");
                });
            }
        });
        
    }

    public showToast(message: string) {
        Toast.makeText(message).show();
    }

    logOut() {
        BackendService.token = "";
        BackendService.userName = "";
        BackendService.email = "";

        firebase.logout();
        this._routerExtensions.navigate(["/login"], { clearHistory: true });
    }

    betaFunction(){
        this._routerExtensions.navigate(["/metronome"]);
    }

    tapUrl(url: string) {
        if(url == "imslp"){
            utilityModule.openUrl("https://imslp.org");
        } else if (url == "blog") {
            utilityModule.openUrl("https://www.blog.apphoven.com");
        } else if (url == "flaticon"){
            utilityModule.openUrl("http://flaticon.com");
        }
    }

    onTap(){
        /*
         * BETA TESTING
         * 
        
        if(this.tapCounter > 0) {
            this._lvlService.practiceXp(1800*20);
            /* BackgroundServices
            var services = require("./background-service/service-helper");
            console.log("ONTAP() NOTIFICATION SERVICE FIRED");
            services.setupAlarm(utilityModule.ad.getApplicationContext());
            
        } else {
            console.log("ONTAP() " + this.tapCounter);
            this.tapCounter++;
        }*/
    }

    ngOnDestroy() {
        console.log("Settings - ngOnDestroy()");
    }
}