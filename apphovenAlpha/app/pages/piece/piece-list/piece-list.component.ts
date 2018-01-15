import { Component, OnInit, OnDestroy, NgZone } from "@angular/core";

// Deprecated Firebase Import
// import firebased = require("nativescript-plugin-firebase");

const firebase = require("nativescript-plugin-firebase/app");
import { firestore } from "nativescript-plugin-firebase";

import { PageRoute } from "nativescript-angular/router";
import { Observable as RxObservable } from 'rxjs/Observable';
import { HttpService, BackendService, PieceService, Piece } from "../../../shared";
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

    // Nativescript doesn't allow an easy way to render an object, 
    // which is created while loading the values from firebase. Therefore: Each value gets an own var
    public pieceTitle: string;
    public pieceWorkNumber: string;
    public pieceMovementAmount: number;

    // UI
    private noPiecesFound: boolean;

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
        this.pieceArray = [];
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
                    let pieceMovementArrayString = this.pieceMovementArray.join(", ");
                    
                    // Push Piece (with Movements)
                    this._ngZone.run(() => {
                        this.pieceArray.push({
                            id: Number(piece.id),
                            title: piece.data().pieceTitle,
                            composerName: composerName,
                            dateAdded: piece.data().dateAdded,
                            movements: pieceMovementArrayString,
                        });
                    });
                    
                } else {
                    // Push Piece (without Movements)
                    this._ngZone.run(() => {
                        this.pieceArray.push({
                            id: Number(piece.id),
                            title: piece.data().pieceTitle,
                            composerName: composerName,
                            dateAdded: piece.data().dateAdded,
                            movements: null
                        });
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

    public firestoreStopListening(): void {
        if (this.listenerUnsubscribe === undefined) {
          console.log("Please start listening first ;)");
          return;
        }
    
        this.listenerUnsubscribe();
        this.listenerUnsubscribe = undefined;
    }

    onPieceTap(args){
        if(this.pieceArray[args.index].movements) {
            let pieceId = this.pieceArray[args.index].id;
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
    
    public showToast(message: string) {
        Toast.makeText(message).show();
    }

    ngOnDestroy() {
        this.firestoreStopListening();
        console.log("Destroyed");
    }
}