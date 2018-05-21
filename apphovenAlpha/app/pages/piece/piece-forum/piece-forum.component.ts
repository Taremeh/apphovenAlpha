import { Component, OnInit, OnDestroy, NgZone } from "@angular/core";

const firebase = require("nativescript-plugin-firebase/app");
import { firestore } from "nativescript-plugin-firebase";

import { PageRoute } from "nativescript-angular/router";
import { BackendService, PieceService } from "../../../shared";
import { Page, isAndroid } from "ui/page";
import * as application from "application";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import { Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import dialogs = require("ui/dialogs");
//import { SwissArmyKnife } from "nativescript-swiss-army-knife";
import * as Toast from "nativescript-toast";
import { TextView } from "nativescript-angular/value-accessors/text-value-accessor";
import { prompt, inputType } from "ui/dialogs";

// Import Parent
import { PieceDashboardComponent } from "../piece-dashboard/piece-dashboard.component";

@Component({
    selector: "ah-piece-forum",
    templateUrl: "pages/piece/piece-forum/piece-forum.component.html",
    styleUrls: ["pages/piece/piece-forum/piece-forum-common.css"]
})

export class PieceForumComponent implements OnInit, OnDestroy {

    // Firestore
    private listenerUnsubscribePieceForum: () => void;

    // Icons
    public addQuestionIcon = String.fromCharCode(0xf128);

    public pieceId;
    //public movementId;
    public messageText;
    public questionArray: Array<any>;
    public adviceArray: Array<any>;

    constructor(private _pageRoute: PageRoute, private _pieceDashboard: PieceDashboardComponent,
        private _pieceService: PieceService, private _ngZone: NgZone) {
        console.log("PIECE FORUM LOADED >>> TEST");
        console.log("PIECE-FORUM: " + this.pieceId);

        this.questionArray = [];
        this.adviceArray = [];
        // Retrieve pieceId from parent component
        this.pieceId = this._pieceDashboard.pieceId;

        console.log("PARENT ID: " + this._pieceDashboard.pieceId);
        this.firestoreListen();

    }

    ngOnInit() {

    }

    public firestoreListen(): void {
        // Handle Statistics-Listener
        if (this.listenerUnsubscribePieceForum !== undefined) {
            console.log("Already listening");
            return;
        } else {
            // Define Firestore Stats Document
            let pieceForumCollection = firebase.firestore()
                .collection("piece")
                .doc(String(this.pieceId))
                .collection("forum");

            if(this._pieceDashboard.movementId != -1){
                pieceForumCollection = pieceForumCollection
                    .where("movementId", "==", this._pieceDashboard.movementId);
            }

            this.listenerUnsubscribePieceForum = pieceForumCollection.onSnapshot((snapshot: firestore.QuerySnapshot) => {
                if (snapshot.docSnapshots.length > 0) {
                    console.log("Handling Snapshot :)");

                    this.questionArray = [];
                    this.adviceArray = [];
                    snapshot.forEach(message => this.handleSnapshot(message));
                    // this.handleSnapshot(snapshot);
                } else {
                    // If last element has been deleted, clear local arrays too.
                    this.questionArray = [];
                    this.adviceArray = [];
                    console.log("No Pieces Found!");
                }
            });
        }
    }

    handleSnapshot(message) {
        if(message.data().type == "question") {
            this._ngZone.run(() => {
                this.questionArray.push(message.data());
                this.questionArray[this.questionArray.length-1].id = message.id;
                console.log("NEW QUESTION PUSHED: " + JSON.stringify(this.questionArray[this.questionArray.length-1]));
                // Sort array by lastUsed. Last Used at the top
                this.questionArray.sort(function(a, b) {
                    return parseFloat(String(b.date)) - parseFloat(String(a.date));
                });
            });
        } else if(message.data().type == "advice") {
            this._ngZone.run(() => {
                this.adviceArray.push(message.data());
            });
        }

        // console.log("HANDLE MESSAGE: " + JSON.stringify(message.data()));
        
    }

    sendMessage(args?) {
        console.log("Message Text: " + this.messageText);

        if(args){
            let textview: TextView = <TextView>args.object;
            if (isAndroid) {
                textview.android.clearFocus();
            }
        }
    }

    answerQuestion(question) {
        console.log("ANSWER QUESTION ID: " + question.id);

        let options = {
            title: "Answer Question",
            defaultText: "",
            message: question.message,
            inputType: inputType.text,
            okButtonText: "Answer",
            cancelButtonText: "Cancel"
        };

        prompt(options).then((r: dialogs.PromptResult) => {
            if(r.result && r.text != "" && r.text != null){
                this._pieceService.answerPost(this.pieceId, question.id, r.text).then(
                    (result) => {
                        this.showToast("Thank you for answering the question!");
                    },
                    (error) => {
                        if(error == "question not found") {
                            this.showToast("Error: Could not find question");
                        } else {
                            this.showToast("Error while trying to answer question");
                        }
                        
                    }
                );
            }
        });

    }

    editQuestion(question) {
        let options = {
            title: "Choose an action:",
            message: "Choose one of the options below.",
            cancelButtonText: "Cancel",
            actions: ["Report Question"]
        };
        
        if(question.userId == BackendService.token) {
            options.actions = ["Delete Question"];
        }

        dialogs.action(options).then((result) => {
            if(result == "Delete Question") {
                this._pieceService.removeQuestion(this.pieceId, question.id)
                .then((r) => {
                    this.showToast("Removed Question");
                },
                (e) => {
                    console.log("Error while deleting question");
                    this.showToast("Error while removing question");
                });
            } else if (result == "Report Question") {
                this._pieceService.reportQuestion(this.pieceId, question.id)
                .then((r) => {
                    this.showToast("Successfully reported question. We'll look into it.");
                },
                (e) => {
                    this.showToast("Error while reporting question.");
                });
            }
        });
    }

    editAnswer(question, answer) {
        if(!question.solved){
            let options = {
                title: "Choose an action:",
                message: "Choose one of the options below.",
                cancelButtonText: "Cancel",
                actions: ["Report Answer"]
            };
            
            if(answer.userId == BackendService.token) {
                // Answer Author
                options.actions = ["Delete Answer"];
            } else if (question.userId == BackendService.token) {
                // Question Host
                options.actions = ["Accept Answer","Report Answer", "Delete Answer"];
            }

            dialogs.action(options).then((result) => {
                if(result == "Delete Answer") {
                    this._pieceService.removeAnswer(this.pieceId, question.id, answer.id)
                    .then((r) => {
                        this.showToast("Removed Answer");
                    },
                    (e) => {
                        console.log("Error while deleting answer");
                        this.showToast("Error while removing answer");
                    });
                } else if (result == "Report Answer") {
                    this._pieceService.reportAnswer(this.pieceId, question.id, answer.id)
                    .then((r) => {
                        this.showToast("Successfully reported answer. We'll look into it.");
                    },
                    (e) => {
                        this.showToast("Error while reporting answer.");
                    });
                } else if(result == "Accept Answer") {
                    this._pieceService.acceptAnswer(this.pieceId, question.id, answer.id)
                    .then((r) => {
                        this.showToast("Hurray! Another problem has been solved!");
                    },
                    (e) => {
                        this.showToast("Error while accepting answer.");
                    });
                }
            });
        } else {
            this.showToast("An answer has already been accepted.");
        }
    }

    prompt(type) {
        let options = {
            title: "Start Discussion",
            defaultText: "",
            inputType: inputType.text,
            okButtonText: "Ok",
            cancelButtonText: "Cancel"
        };

        if(type == "question") { 
            options.title = "Ask for advice";
            options.okButtonText = "Ask";
        } else if (type == "advice") {
            options.title = "Give advice";
            options.okButtonText = "Submit";

            // MAINTENANCE - DEVELOPEMENT FROM HERE
            this.showToast("Feature will be added soon");
            return
        }
        
        prompt(options).then((r: dialogs.PromptResult) => {
            if(r.result && r.text != "" && r.text != null){
                this._pieceService.submitPost(BackendService.token, this.pieceId, type, r.text, this._pieceDashboard.movementId).then(
                    (result) => {
                        this.showToast("Successfully submitted " + type + "!");
                    },
                    (error) => {
                        this.showToast("Error while trying to submit " + type);
                    }
                );
            }
        });
    }

    // DEV IN PROGRESS (TabView)
    onIndexChanged(args) {
    }

    public showToast(message: string) {
        Toast.makeText(message).show();
    }

    public firestoreStopListening(): void {
        if (this.listenerUnsubscribePieceForum === undefined) {
            console.log("Please start listening first ;)");
            return;
        } else {
            this.listenerUnsubscribePieceForum();
            this.listenerUnsubscribePieceForum = undefined;
        }
    }

    ngOnDestroy(){
        this.firestoreStopListening();
        console.log("Destroyed piece-forum.component");
    }

}
