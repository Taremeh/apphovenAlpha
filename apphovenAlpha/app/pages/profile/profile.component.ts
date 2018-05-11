import { Component, OnInit, OnDestroy, NgZone, ViewChild, ElementRef } from "@angular/core";
const firebase = require("nativescript-plugin-firebase/app");
import { firestore } from "nativescript-plugin-firebase";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import * as Toast from "nativescript-toast";
import * as dialogs from "ui/dialogs";
import * as utils from "utils/utils";

import { BackendService, LoginService, SocialService } from "../../shared";

// Prompt
import { prompt, PromptResult, inputType } from "ui/dialogs";
import { dashCaseToCamelCase } from "@angular/compiler/src/util";
import { SwipeGestureEventData } from "tns-core-modules/ui/gestures/gestures";
import { RouterExtensions } from "nativescript-angular/router";

@Component({
    selector: "ah-profile",
    templateUrl: "pages/profile/profile.component.html",
    styleUrls: ["pages/profile/profile-common.css"]

})


export class ProfileComponent implements OnInit, OnDestroy {
    
    private username: string;

    // Firestore
    private listenerUnsubscribeStats: () => void;
    private listenerUnsubscribeProfile: () => void;
    private listenerUnsubscribeFriends: () => void;

    // UI LVL (Default: LVL 1)
    private userLvl = 1;
    private xpCurrent = 0;
    private xpCurrentDisplayBar = 4;
    private xpMax = 50;

    // UI LVL Overview (Array)
    private levelArray: Array<any>;
    private levelNumbers: Array<any>;
    private showLevel: number = -1;

    // Icons
    private arrowDownIcon = String.fromCharCode(0xf078);
    private arrowUpIcon = String.fromCharCode(0xf077);
    private addFriendIcon = String.fromCharCode(0xf234);
    // private settingsIcon = String.fromCharCode(0xf013);

    // UI Logic
    private showPublicProfile: boolean;
    
    // Data Logic (User Profile)
    private profileIsPublic: boolean;
    private availableForHire: boolean;
    private userProfile;
    private friendArray: Array<any>;

    @ViewChild("xpProgressBar") xpProgressBar: ElementRef;

    constructor(private _ngZone: NgZone, private page: Page, private _loginService: LoginService,
                private _socialService: SocialService, private _routerExtensions: RouterExtensions) {

        // Show Username (or Email)
        this.username = BackendService.userName || BackendService.email;

        this.userProfile = {
            userDescription: "Loading",
            userAwards: "Loading",
            profileIsPublic: false,
            availableForHire: false,
            availableForHireDescription: "Loading",
            availableForHireEmail: "Loading",
            userVideoLink: "Loading",
            userUrl: "Loading"
        }

        this.firestoreListen();

        // Initialize Lvl-Numbers
        this.levelNumbers = [];
        for(let lvl = 1; lvl < 10; lvl++) {
            this.levelNumbers.push({
                col: lvl, // positioning index
                lvl: lvl*10,
                state: false
            });
        }

        // Initialize levelArray
        this.levelArray = [];
        this._ngZone.run(() => {
        for(let lvl = 1; lvl < 10; lvl++) {
            this.levelArray.push({
                lvl: lvl*10,
                title: "",
                description: "",
                mediaLink: "",
                state: false
            })
        }

        this.levelArray[0].title="Moonlight Sonata";
        this.levelArray[0].description="The Moonlight Sonata is one of Beethoven's most popular compositions for the piano. He composed it in his thirties (1801). Especially the 3rd movement is held to have been the inspiration for Frédéric Chopin's Fantaisie-Impromptu, a tribute to Beethoven.";
        this.levelArray[0].mediaLink="https://www.youtube.com/watch?v=OsOUcikyGRk";

        this.levelArray[1].title="For Elise";
        this.levelArray[1].description=`Even though "Für Elise" is a very popular composition, it is quite mysterious as well. For Elise was not published during Beethoven's lifetime. It has been transcribed 40 years later. It's not clear whether Beethoven actually named the composition "Für Elise". And even if, the identity of Elise is still unknown.`;
        this.levelArray[1].mediaLink="https://www.youtube.com/watch?v=e4BysqPWgfc";

        this.levelArray[2].title="Level 30";
        this.levelArray[2].description=`Level Description will be added soon.`
        this.levelArray[2].mediaLink="";

        this.levelArray[3].title="Level 40";
        this.levelArray[3].description=`Level Description will be added soon.`
        this.levelArray[3].mediaLink="";

        this.levelArray[4].title="Level 50";
        this.levelArray[4].description=`Level Description will be added soon.`
        this.levelArray[4].mediaLink="";

        this.levelArray[5].title="Level 60";
        this.levelArray[5].description=`Level Description will be added soon.`
        this.levelArray[5].mediaLink="";

        this.levelArray[6].title="Level 70";
        this.levelArray[6].description=`Level Description will be added soon.`
        this.levelArray[6].mediaLink="";

        this.levelArray[7].title="Level 80";
        this.levelArray[7].description=`Level Description will be added soon.`
        this.levelArray[7].mediaLink="";

        this.levelArray[8].title="Level 90";
        this.levelArray[8].description=`Level Description will be added soon.`
        this.levelArray[8].mediaLink="";
        });
    }

    ngOnInit() {
        // Hide ActionBar
        this.page.actionBarHidden = true;

        console.log("Initialized profile.component");
    }

    navigateTo(page: string){
        console.log("NAVIGATE ?");
        this._routerExtensions.navigate([page], {
            transition: {
                name: "slideLeft",
                duration: 150,
                curve: "easeIn"
            }
        });
    }

    navigationSwipe(args: SwipeGestureEventData) {
        console.log("Swipe Direction: " + args.direction);
        if(args.direction == 1) {
            this._routerExtensions.back();
        } else if(args.direction == 8) {
            // Swipe down: showPublicProfile
            this.showPublicProfile = true;
        } else if(args.direction == 4) {
            // Swipe up: Hide Public Profile
            this.showPublicProfile = false;
        }
    }

    public firestoreListen(): void {
        console.log("FIRESTORE LISTENS: " + BackendService.token);

        // Handle Statistics-Listener
        if (this.listenerUnsubscribeStats !== undefined) {
            console.log("Already listening");
            return;
        } else {
            // Define Firestore Stats Document
            let statsCollection = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("stats")
            .orderBy("dateStarted", "desc")
            .limit(1);


            this.listenerUnsubscribeStats = statsCollection.onSnapshot((snapshot: firestore.QuerySnapshot) => {
                snapshot.forEach(user => this.handleStatsSnapshot(user));
            });
        }

        // Handle Profile-Listener
        if (this.listenerUnsubscribeProfile !== undefined) {
            console.log("Already listening");
            return;
        } else {
            // Define Firestore User Document
            let profileDoc = firebase.firestore()
                .collection("user")
                .doc(BackendService.token);

            this.listenerUnsubscribeProfile = profileDoc.onSnapshot(doc => this.handleProfileSnapshot(doc));
        }

        // Handle Friends-Listener
        if (this.listenerUnsubscribeFriends !== undefined) {
            console.log("Already listening");
            return;
        } else {       

            // Define Firestore User Document
            let friendCollection = firebase.firestore()
                .collection("user")
                .doc(BackendService.token)
                .collection("friend");

            this.listenerUnsubscribeFriends = friendCollection.onSnapshot((snapshot: firestore.QuerySnapshot) => {
                // Init & reset friendArray
                this.friendArray = [];
                
                if(snapshot.docSnapshots.length == 0) {
                    console.log("PUSH DUMMY");
                    this._ngZone.run(() => {
                        this.friendArray.push({
                            friendName: false,
                            friendId: "addFriend",
                            confirmed: false
                        });
                    });
                } else {
                    snapshot.forEach(friend => this.handleFriendSnapshot(friend));
                }
            });
        }
    }

    public handleStatsSnapshot(user){
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

                    // Populate levelArray for Level-Overview (and ajust levelNumbers)
                    for(let lvlIndex = 0; lvlIndex < 9; lvlIndex++) {
                        if(this.levelArray[lvlIndex].lvl <= this.userLvl) {
                            console.log("STATE TRUE FOR: " + this.levelArray[lvlIndex].lvl + " VS UserLVL: " + this.userLvl);
                            this.levelArray[lvlIndex].state = true;
                            this.levelNumbers[lvlIndex].state = true;
                        } else {
                            console.log("STATE false FOR: " + this.levelArray[lvlIndex].lvl + " VS UserLVL: " + this.userLvl);
                            this.levelArray[lvlIndex].state = false;
                            this.levelNumbers[lvlIndex].state = false;
                        }
                    }
                });
            }
        });
    }

    public handleProfileSnapshot(profileEntity){
        if (profileEntity.exists) {
            this._ngZone.run(() => {
                this.userProfile = {
                    userDescription: profileEntity.data().userDescription || "Press long to add a User Description",
                    userAwards: profileEntity.data().userAwards || "",
                    profileIsPublic: profileEntity.data().profileIsPublic || false,
                    availableForHire: profileEntity.data().availableForHire || false,
                    availableForHireDescription: profileEntity.data().availableForHireDescription || "",
                    availableForHireEmail: profileEntity.data().availableForHireEmail || "",
                    userVideoLink: profileEntity.data().userVideoLink || "",
                    userUrl: profileEntity.data().userUrl || "YOUR NAME"
                }

                console.log("FRIENDS: " + JSON.stringify(this.userProfile.userFriends));
            });
        } else {
            this._ngZone.run(() => {
                this.userProfile = {
                    userDescription: "Press long to add a User Description",
                    userAwards: "",
                    profileIsPublic: false,
                    availableForHire: false,
                    availableForHireDescription: "",
                    availableForHireEmail: "",
                    userVideoLink: "",
                    userUrl: "YOUR NAME"
                }
            });
        }
    }

    public handleFriendSnapshot(friend){
        if(friend.id === null){console.log("FRIEND EMPTY");}
        let index = this.friendArray.findIndex(x => x.friendId==friend.id);
        console.log("PROCESS FRIEND DATA. INDEX: " + index);
        /* if(index != -1) {
            // Update Friend Value
            // This "If"-Part currently only gets triggered when deleting a friend, so => delete:
            console.log("UPDATE FRIEND VALUE / DELETE FRIEND: " + JSON.stringify(friend));
            this.friendArray.splice(index, 1);
        } else {*/
            // Push friend to Array
            console.log("PUSH FRIEND TO ARRAY");
            this._ngZone.run(() => {
                this.friendArray.push({
                    friendName: friend.data().friendName,
                    friendId: friend.id,
                    confirmed: friend.data().confirmed,
                });
            });
        //}
        
    }

    badgeTap(lvl) {
        console.log("LEVEL TAPPED: " + lvl);
        if(this.showLevel == lvl){
            // Hide Lvl-Description
            this.showLevel = -1;
        } else if(lvl > this.userLvl) {
            // Level locked
            this.showLevel = -1;
            this.showToast("This Level is locked");
        } else {
            this.showLevel = lvl;
        }
    }

    swipeLevelContainer(args: SwipeGestureEventData) {
        // Prepare newLevel
        let newLevel = this.showLevel;

        if(args.direction == 1){
            // Swipe left
            if(this.showLevel > 10) newLevel = this.showLevel - 10;
        } else if(args.direction == 2){
            // Swipe right
            newLevel = this.showLevel + 10;
        }

        if(newLevel > this.userLvl) {
            // Level locked
            this.showToast("This Level is locked");
        } else {
            // Set new Level
            this.showLevel = newLevel;
        }

        console.log("New Level: " + this.showLevel);
    }

    userEdit(propertyName, propertyBoolean?: boolean) {
        let options = {
            title: "Please Edit", // Placeholder
            message: "",
            defaultText: "",
            inputType: inputType.text,
            okButtonText: "Ok",
            cancelButtonText: "Cancel"
        };

        if(propertyName == 'userDescription') {
            options.title = "Edit your User Description";
            options.defaultText = this.userProfile.userDescription || "";
        } else if (propertyName == 'userAwards') {
            options.message = "Separate your awards with commas. Use the following format for best results:\n\nCompetition Nr.1 2018 - 1st Prize,\nCompetition Nr.2 2017 - 3rd Prize";
            options.title = "Edit your Awards";
            options.defaultText = this.userProfile.userAwards || "";
        } else if (propertyName == 'userUrl') {
            options.message = "Enter a unique name, so we can generate your web profile address";
            options.title = "Choose unique User-URL";
        } else if (propertyName == 'userVideoLink') {
            options.message = "Enter the YouTube-Link of the video you're playing piano in. Leave blank to remove the video.";
            options.title = "Add YouTube Video";
            this.userProfile.userVideoLink!="" ? options.defaultText = "https://youtu.be/" + this.userProfile.userVideoLink : options.defaultText = "";
        } else if (propertyName == 'profileIsPublic') {
            // Return without showing Prompt
            return this._loginService.updateProfile(propertyName, propertyBoolean).then(
                (result) => {
                    this.showToast("Profile successfully changed!");
                    return
                },
                (error) => {
                    console.log("ERROR: " + error);
                    this.showToast("Error while updating Profile :(");
                    return
                }
            );
        } else if (propertyName == 'availableForHire') {
            // Abort if profile is not public
            if(!this.userProfile.profileIsPublic){
                return this.showToast("Profile needs to be public");
            }

            if(propertyBoolean){
                // Available For Hire
                options.title = "Available for Hire";
                options.message = "Describe the musical services you offer.\n\ne.g. I do Event-Opener Concerts, Background Music, Full-Length Concerts ...";
                options.defaultText = this.userProfile.availableForHireDescription || "";

                prompt(options).then((r: PromptResult) => {
                    if(r.result == true){
                        console.log("UserInput: " + r.text);
                        // First Add Service-Description
                        this._loginService.updateProfile("availableForHireDescription", r.text).then(
                            (result) => {
                                options.title = "Contact Address";
                                options.message = "Enter your e-mail address for clients to contact you.";
                                options.defaultText = this.userProfile.availableForHireEmail || "";

                                prompt(options).then((r: PromptResult) => {
                                    if(r.result && (r.text!="")){
                                        // Second, Retrieve Contact Address
                                        this._loginService.updateProfile("availableForHireEmail", r.text).then(
                                            (result) => {
                                                // Third, set Hire-Boolean to true
                                                this._loginService.updateProfile(propertyName, propertyBoolean).then(
                                                    (result) => {
                                                        this.showToast("Profile successfully changed!");
                                                    },
                                                    (error) => {
                                                        this.showToast("Error while updating Profile :(");
                                                    }
                                                );
                                            },
                                            (error) => {
                                                this.showToast("Error while updating Profile :(");
                                            }
                                        );
                                    } else {
                                        this.showToast("No Changes Made");
                                        console.log("Abort Hire (Location: Contact Adddress Input)");
                                        return;
                                    }
                                });
                            },
                            (error) => {
                                console.log("ERROR: " + error);
        
                                if(error == 'user-url taken') {
                                    this.showToast("Error: User-URL already taken!");
                                } else {
                                    this.showToast("Error while updating Profile :(");
                                }
                            }
                        );
                    } else {
                        console.log("Abort Hire (Location: Hire Description Input)");
                        // Reset availableForHire to false
                        return this._loginService.updateProfile(propertyName, false);
                    }
                });
            } else {
                // Not Available For Hire
                return this._loginService.updateProfile(propertyName, propertyBoolean).then(
                    (result) => {
                        this.showToast("Profile successfully changed!");
                        return
                    },
                    (error) => {
                        console.log("ERROR: " + error);
                        this.showToast("Error while updating Profile :(");
                        return
                    }
                );
            } 
        }
        
        if(propertyName != 'availableForHire') {
            console.log("PROMPT LOADED");
            prompt(options).then((r: PromptResult) => {
                if(r.result){
                    // If userVideoLink => Check if link is from YouTube
                    if(propertyName != 'userVideoLink' || (propertyName == 'userVideoLink' && (r.text.includes("youtube.com") || r.text.includes("youtu.be") || r.text == ""))) {
                        console.log("UserInput: " + r.text);
                        this._loginService.updateProfile(propertyName, r.text).then(
                            (result) => {
                                this.showToast("Profile successfully changed!");
                            },
                            (error) => {
                                console.log("ERROR: " + error);

                                if(error == 'user-url taken') {
                                    this.showToast("Error: User-URL already taken!");
                                } else if (error == 'user-url too short/long') {
                                    this.showToast("Error: User-URL must be between 3 - 25 characters long");
                                } else {
                                    this.showToast("Error while updating Profile :(");
                                }
                            }
                        );
                    } else {
                        this.showToast("Error: Video must be from YouTube!");
                    }
                } 
            });
        }
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

    public showToast(message: string) {
        Toast.makeText(message).show();
    }

    addFriend () {
        let options = {
            title: "Add Friend", // Placeholder
            message: "Enter your friends E-Mail or User-ID\n\ref. user.apphoven.com/USER-ID",
            defaultText: "",
            inputType: inputType.text,
            okButtonText: "Add",
            cancelButtonText: "Cancel"
        };
        prompt(options).then((r: PromptResult) => {
            if(r.result){
                this._socialService.addFriend(r.text).then(
                (friendName) => {
                    this.showToast("Friend request sent to " + friendName);
                    console.log("RESULT ADD FRIEND: " + JSON.stringify(friendName));
                },
                (e) => {
                    console.log("Error ADD FRIEND: " + e);

                    if(e == "friend-id equals user-id"){
                        this.showToast("You can't add yourself as a friend");
                    } else if(e == "friend already added") {
                        this.showToast("Friend already added");
                    } else {
                        this.showToast("Friend not found");
                    }
                }

                // If userVideoLink => Check if link is from YouTube
                /*    this._loginService.updateProfile(propertyName, r.text).then(
                        (result) => {
                            this.showToast("Profile successfully changed!");
                        },
                        (error) => {
                            console.log("ERROR: " + error);

                            if(error == 'user-url taken') {
                                this.showToast("Error: User-URL already taken!");
                            } else if (error == 'user-url too short') {
                                this.showToast("Error: User-URL too short! (3+)");
                            } else {
                                this.showToast("Error while updating Profile :(");
                            }
                        }
                    );
                } else {
                    this.showToast("Error: Video must be from YouTube!");
                }*/
                );
            }
        });
    }

    onTapFriend(friendId){
        if(friendId == "addFriend"){
            this.addFriend();
        } else {
            this.showToast("Friend-Profile-Access coming soon :)");
        }
    }

    onPressFriend(friendId, friendName){
        dialogs.confirm({
            title: "Remove Friend?",
            message: "Confirm to remove your friend:\n" + friendName,
            okButtonText: "Remove",
            cancelButtonText: "Cancel",
        }).then(result => {
            if(result){
                this._socialService.removeFriend(friendId).then(() => {
                    this.showToast("Friend successfully removed");
                });
            }
        });
    }

    public firestoreStopListening(): void {
        if (this.listenerUnsubscribeStats === undefined) {
            console.log("Please start listening first ;)");
            return;
        } else {
            this.listenerUnsubscribeStats();
            this.listenerUnsubscribeStats = undefined;
        }

        if(this.listenerUnsubscribeProfile === undefined) {
            console.log("Please start listening first ;)");
            return;
        } else {
            this.listenerUnsubscribeProfile();
            this.listenerUnsubscribeProfile = undefined;
        }

        if(this.listenerUnsubscribeFriends === undefined) {
            console.log("Please start listening first ;)");
            return;
        } else {
            this.listenerUnsubscribeFriends();
            this.listenerUnsubscribeFriends = undefined;
        }
    }

    openUrl(url){
        utils.openUrl(url);
    }

    ngOnDestroy(){
        this.firestoreStopListening();
        console.log("Destroyed profile.component");
    }
}