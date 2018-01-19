import { Component, OnInit, OnDestroy, NgZone } from "@angular/core";

// Deprecated Firebase Import
// import firebased = require("nativescript-plugin-firebase");

const firebase = require("nativescript-plugin-firebase/app");
import { firestore } from "nativescript-plugin-firebase";

import { PageRoute } from "nativescript-angular/router";
import { Observable as RxObservable } from 'rxjs/Observable';
import { HttpService, BackendService, PieceService, Piece, ComposerNamePipe } from "../../../shared";
import { Page } from "ui/page";
import * as application from "application";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import { Router } from "@angular/router";
import dialogs = require("ui/dialogs");
import * as Toast from "nativescript-toast";
import { Observable } from "rxjs/Observable";

@Component({
    selector: "ah-piece-list",
    templateUrl: "pages/piece/piece-list/piece-list.component.html",
    styleUrls: ["pages/piece/piece-list/piece-list-common.css"]
})
export class PieceListComponent implements OnInit, OnDestroy {
    public routerParamId: number;
    public myItems: RxObservable<Array<any>>;

    public pieceArray: Array<Piece>;
    public pieceMovementIdArray: Array<any>;
    public pieceMovementArray: Array<any>;
    public pieceMovementArrayNotSelected: Array<any>;

    // Icons
    public iconSettings = String.fromCharCode(0xf1f8);
    public iconAdd = String.fromCharCode(0xf067);

    // Nativescript doesn't allow an easy way to render an object, 
    // which is created while loading the values from firebase. Therefore: Each value gets an own var
    public pieceTitle: string;
    public pieceWorkNumber: string;
    public pieceMovementAmount: number;

    // UI
    private noPiecesFound: boolean;
    public pieceComposer: string;
    /* public pieceBoxBgImages = [
        {"1708": "https://firebasestorage.googleapis.com/v0/b/apphoven.appspot.com/o/piece-box-graphics%2Fbg-1.png?alt=media&token=9f33614e-1dc1-4aa0-9226-5addba53f2eb"},
        {"3864": "https://firebasestorage.googleapis.com/v0/b/apphoven.appspot.com/o/piece-box-graphics%2Fbg-2.png?alt=media&token=a880dec0-830c-45ba-9757-b05bb432b071"},
        {"288": "https://firebasestorage.googleapis.com/v0/b/apphoven.appspot.com/o/piece-box-graphics%2Fbg-3.png?alt=media&token=db2ccb32-db4d-4fad-b3cb-90dc2dcb33b6"}
    ]; */

    // Observables
    private listenerUnsubscribe: () => void;

    constructor(private _pageRoute: PageRoute, private _page: Page, private _router: Router,
                private _ngZone: NgZone, private _pieceService: PieceService, private _httpService: HttpService) {
        this.pieceArray = [];
        this.pieceMovementArray = [];
        this.pieceMovementIdArray = [];
        this.pieceMovementArrayNotSelected = [];

        this._pageRoute.activatedRoute
        .switchMap(activatedRoute => activatedRoute.params)
        .forEach((params) => { this.routerParamId = Number(params['id']); });
        console.log("PARAM: "+this.routerParamId);

        // Fetch User-Data from Firebase (true, because of first initialization)
        // this.firestoreListen();

    }

    ngOnInit() {
        this.firestoreListen();
        // Hide Action-Bar
        //this._page.actionBarHidden = true;

        /*application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
            console.log("BACK BUTTON EVENT TRIGGERED");
            //this._router.navigate(['/addpiece']);
        });*/
    }

    public firestoreListen(): void {
        if (this.listenerUnsubscribe !== undefined) {
          console.log("Already listening");
          return;
        }

        // CLEARING
        this.pieceArray = [];
        this.pieceMovementIdArray = [];
        
        // Define Firestore Collection
        let pieceCollection = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("piece");

        // Define Firestore Query
        let query = pieceCollection
            .orderBy("dateLastUsed", "desc");

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
        this.pieceArray = [];

        let composers = ["Haydn","Mozart","Beethoven","Mozart","Schubert","Beethoven","Schubert","Scarlatti","Haydn","Scarlatti"];
        let randomComposerId = Math.floor((Math.random() * 9) + 0);
        let randomComposer = composers[randomComposerId];

        // Add New Piece Option as Piece-Box-Item
        this.pieceArray.push({
            id: -1,
            title: "Add new Piece",
            composerId: null,
            composerName: "Maybe " + randomComposer + "?",
            workNumber: null,
            dateAdded: null,
            dateLastUsed: 1,
            movements: null,
            pos: -1
        });

        // Check if Snapshot contains Pieces (snapshot.docsSnapshots: [])
        if(snapshot.docSnapshots.length !== 0){
            snapshot.forEach(piece => {
                console.log("The Result: " + JSON.stringify(piece) + "\n\n");
                console.log("> PIECE SUCCESSFULLY RETRIEVED.");
                console.log(">> Analysing Data \n");
                console.log(">>> Piece ID: " + piece.id);
                console.log(">>> Piece Value: " + JSON.stringify(piece.data()));
                piece.data().movementItem ? console.log(">>> Movements: " + JSON.stringify(piece.data().movementItem.length) + "\n\n") : console.log(">>> Movements: 0\n\n");
            
                // Maintenance: Implement function to directly retrieve composerName
                let composerName;
                if(piece.data().movementItem){
                    // Piece contains Movements
                    console.log("MOVEMENT-ITEMS FOUND");
                
                    // CLEARING
                    this.pieceMovementArray = [];
                
                    let movementAmount = piece.data().movementItem.length;
                    for (let iMov = 0; iMov < movementAmount; iMov++) {
                        if(piece.data().movementItem[iMov].state == 1){
                            this.pieceMovementArray.push(piece.data().movementItem[iMov].title);
                        }
                    }
            
                    // Join pieceMovementArray to String
                    let pieceMovementArrayString = "\n" + this.pieceMovementArray.join("\n");
                    

                    /* 
                     * MAINTENANCE:
                     * Is it possible to exclude the http.get.composer step and therefore
                     * minimize loading time? Already tried to implement it as a
                     * Pipe, however, did not work out. Maybe need to construct a complicated
                     * Observable complex to make it work... :/
                     */

                    // Get Composer Name
                    this._httpService.getComposerName(piece.data().composerId)
                        .subscribe((res) => {
                            composerName = res[0].name;

                            // Push Piece (with Movements)
                            this._ngZone.run(() => {
                                this.pieceArray.push({
                                    id: Number(piece.id),
                                    title: piece.data().pieceTitle,
                                    composerName: composerName,
                                    composerId: piece.data().composerId,
                                    workNumber: piece.data().pieceWorkNumber,
                                    dateAdded: piece.data().dateAdded,
                                    dateLastUsed: piece.data().dateLastUsed,
                                    movements: pieceMovementArrayString,
                                });
                            });
                            this.sortPieceArray();
                        });

                    
                    
                } else {
                    // Get Composer Name
                    this._httpService.getComposerName(piece.data().composerId)
                    .subscribe((res) => {
                        composerName = res[0].name;

                        // Push Piece (without Movements)
                        this._ngZone.run(() => {
                            this.pieceArray.push({
                                id: Number(piece.id),
                                title: piece.data().pieceTitle,
                                composerId: piece.data().composerId,
                                composerName: composerName,
                                workNumber: piece.data().pieceWorkNumber,
                                dateAdded: piece.data().dateAdded,
                                dateLastUsed: piece.data().dateLastUsed,
                                movements: null,
                            });
                            
                        });
                        // INSIST ON ORDER: PIECE RECENTLY USED > OLD PIECE > ADD NEW PIECE
                        this.sortPieceArray();

                    });
                }
            });
        } else {
            // No Pieces Found
            this._ngZone.run(() => {
                this.noPiecesFound = true;
                console.log("NO PIECES FOUND");
            });
        }        
    }

    sortPieceArray() {
        this._ngZone.run(() => {
            // Sort array by lastUsed. Last Used at the top
            this.pieceArray.sort(function(a, b) {
                return parseFloat(String(b.dateLastUsed)) - parseFloat(String(a.dateLastUsed));
            });
        });
    }

    public firestoreStopListening(): void {
        if (this.listenerUnsubscribe === undefined) {
          console.log("Please start listening first ;)");
          return;
        }
    
        this.listenerUnsubscribe();
        this.listenerUnsubscribe = undefined;
    }

    onPieceTap(piece){
        if(piece.id == -1){
            // Tapped "Add a new piece"
            this._router.navigate(['/addpiece']);
        } else if(piece.movements) {
            let pieceId = piece.id;
            console.log("PIECE ID TAPPED: "+pieceId);
            this._router.navigate(['/piece-db/'+pieceId+"/0"]);
        } else {
            this.showToast("This piece doesn't contain any movements");
        }
    }

    showPieceOptions(pieceId: number){
        console.log("üBERMITTELTE PIECE ID: ->" + pieceId + "<-");
        let that = this;
        dialogs.confirm({
            title: "Delete piece from Practice-List?",
            message: "Do you want to remove this piece (and all its movements) from your Practice-List? \n\nYour Practice-Progress (Practice-Sessions) won't be deleted.",
            okButtonText: "Yes, remove please",
            cancelButtonText: "No!",
        }).then(function (result) {
            if(result){
                that._pieceService.removePiece(pieceId).then(
                    function () {
                        console.log("success REMOVING");
                        //that.loadFirebaseData();
                },
                function (error) {
                console.log("firebase.keepInSync error: " + error);
                }
                );
            }
        });
    }

    /*
     * MAINTENANCE:
     * Random pieceBoxBgImages in work
     * (Future update)
     */
    public pieceBoxImageLoaded(pieceId) {
        //console.log("BG-IMAGE LOADED " + pieceId);
    }
    public pieceBoxBgImage() {
        let pieceBoxBgImages = [
            "https://firebasestorage.googleapis.com/v0/b/apphoven.appspot.com/o/piece-box-graphics%2Fbg-1.png?alt=media&token=9f33614e-1dc1-4aa0-9226-5addba53f2eb",
            "https://firebasestorage.googleapis.com/v0/b/apphoven.appspot.com/o/piece-box-graphics%2Fbg-2.png?alt=media&token=a880dec0-830c-45ba-9757-b05bb432b071",
            "https://firebasestorage.googleapis.com/v0/b/apphoven.appspot.com/o/piece-box-graphics%2Fbg-3.png?alt=media&token=db2ccb32-db4d-4fad-b3cb-90dc2dcb33b6"
        ];
        let randomImage = Math.floor((Math.random() * 2) + 0);
        console.log("RANDOM NUbeMER: " + randomImage)
        console.log("string: " + pieceBoxBgImages[randomImage]);
        return String(pieceBoxBgImages[randomImage]);
    }

    public showToast(message: string) {
        Toast.makeText(message).show();
    }

    ngOnDestroy() {
        this.firestoreStopListening();
        console.log("Destroyed");
    }
}