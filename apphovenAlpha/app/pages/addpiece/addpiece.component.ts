import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import { TextField } from "ui/text-field";
import { HttpService, BackendService } from "../../shared";
import { Color } from "color";
import * as application from "application";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import firebase = require("nativescript-plugin-firebase");

@Component({
    selector: "ah-addpiece",
    templateUrl: "pages/addpiece/addpiece.component.html",
    styleUrls: ["pages/addpiece/addpiece-common.css"],
})
export class AddPieceComponent implements OnInit {

    public firebaseUserPieces: any;

    // public searchResp: Array<any>; // For Testing
    public composerArray: Array<any>; // For Listview
    public composerData: Array<any>; // To fetch data
    public composerName: string;
    public composerId: number;

    public pieceArray: Array<any>; // For Listview
    public pieceData: Array<any>; // To fetch data
    public pieceDataId: number;
    public pieceId: number;
    public piecePreviewItemText: string;
    public pieceItemText: Array<any>;

    public movementArray: Array<any>;
    public pieceMovementArray: Array<any>;

    public searchPhrase;
    public searchHint = "Mozart";

    public showDetails: boolean = false;

    public currentView: number = 0;

    constructor(private _page: Page, private _httpService: HttpService) {
        // this.searchResponse = [];
        this.composerArray = [];
        this.composerData = [];
        this.pieceArray = [];
        this.pieceData = [];
        this.pieceItemText = [];
        this.movementArray = [];
        this.pieceMovementArray = [];
        this.firebaseUserPieces;
    }

    @ViewChild("searchContainer") searchContainer: ElementRef;
    @ViewChild("pieceContainer") pieceContainer: ElementRef;
    @ViewChild("searchComposerList") searchComposerList: ElementRef;
    @ViewChild("searchPieceList") searchPieceList: ElementRef;
    @ViewChild("sbComposer") sbComposer: ElementRef;
    @ViewChild("sbPiece") sbPiece: ElementRef;
    @ViewChild("scrlView") scrlView: ElementRef;

    ngOnInit() {
        this._page.actionBarHidden = true;
        application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
          if (1 < 2) {
            console.log("BACK BUTTON EVENT TRIGGERED");
            this.backEvent(data);
          }
        });
    }
    
    searchComposer(composerName: string){
        if((composerName+"").length > 3) {
                this._httpService.getData(1, composerName).subscribe((res) => {
                    console.log(JSON.stringify(res));
                    // this.searchResp[0] = JSON.stringify(res.composer[0].name_de); // Currently: Display German Name
                    this.composerData = res;
                    this.composerArray = [];
                    
                    for (let i = 0; i < res.length; i++) {
                        this.composerArray.push(res[i]);
                    }
                    
                }, (e) => {
                    console.log("ERROR: " + e);
                    console.log("HEADER ERROR: " + e.header["Content-Type"]);
                });
        }
    }

    onComposerItemTap(args) { // Would it be possible to directly pass a parameter with the object?
        console.log("Composer ID: " + this.composerData[args.index].id);
        this.composerId = this.composerData[args.index].id;
        this.composerName = this.composerData[args.index].name;
        this.showSearchPieceList();
    }

     onPieceItemTap(args) { // Would it be possible to directly pass a parameter with the object?
        console.log("Piece ID: " + this.pieceData[args.index].piece_id);
        this.pieceId = this.pieceData[args.index].piece_id;
        this.pieceDataId = args.index;
        this.showPieceItem();
    }

    searchPiece(pieceTitle: string) {
        if((pieceTitle+"").length > 3) {
                this._httpService.getData(2, pieceTitle, this.composerId).subscribe((res) => {
                    console.log(JSON.stringify(res));
                    // this.searchResp[0] = JSON.stringify(res.composer[0].name_de); // Currently: Display German Name
                    this.pieceData = res;
                    this.pieceArray = [];
                    let arrayText: string = "";
                    
                    for (let i = 0; i < res.length; i++) {
                        this.pieceArray.push(res[i]);
                        if(this.pieceArray[i].piece_movement_title.substring("|")){
                            this.movementArray = this.pieceArray[i].piece_movement_title.split("|");
                            // this.pieceArray[i].piece_movement_array = movementArray; 
                            console.log("ARRAY: " + this.movementArray[0]);
                            this.pieceArray[i].piece_movement_text = "Movements: " + this.movementArray.join(", ");
                        }
                        if(this.pieceArray[i].piece_langauge){
                            console.log("PIECE LANGUAGE");
                            arrayText += "Piece Language: " + this.pieceArray[i].piece_langauge + "\n";
                        }
                        if(this.pieceArray[i].piece_key){
                            console.log("PIECE KEY");
                            arrayText += "Piece Key: " + this.pieceArray[i].piece_key + "\n";
                        }
                        this.pieceArray[i].piece_text = arrayText;
                        arrayText = "";

                        let pLengthCut = this.pieceArray[i].piece_title.length - (this.composerName.length + 2);
                        this.pieceArray[i].piece_title = this.pieceArray[i].piece_title.substring(0, pLengthCut);
                        
                        this.pieceItemText = this.pieceArray[i];
                    }
                    
                    
                }, (e) => {
                    console.log("ERROR: " + e);
                    console.log("HEADER ERROR: " + e.header["Content-Type"]);
                });
        }
    }

    showSearchPieceList() {
        let searchComposerList = <View>this.searchComposerList.nativeElement;
        let searchPieceList = <View>this.searchPieceList.nativeElement;
        let sbComposer = <View>this.sbComposer.nativeElement;
        let sbPiece = <View>this.sbPiece.nativeElement;

        this.currentView = 1;

        searchComposerList.style.visibility = "collapse";
        sbComposer.style.visibility = "collapse";
    
        searchPieceList.style.visibility = "visible";
        sbPiece.style.visibility = "visible";
        this.searchPhrase = null;
        sbPiece.focus();
    }

    showPieceItem() {

        /*  ///////////////////////
            ////  NOT WORKING  ////
        */  ///////////////////////

        var onQueryEvent = function(result) {
            // note that the query returns 1 match at a time
            // in the order specified in the query
            if (!result.error) {
                console.log("Event type: " + result.type);
                console.log("Key: " + result.key);
                console.log("Value: " + JSON.stringify(result.value));
                /*let len = this.movementArray.length;

                for (let i = 0; i < len; i++) {
                    this.pieceMovementArray.push({
                        title: result.value.movementItem[i].title,
                        state: result.value.movementItem[i].state
                    });
                    console.log("DIE AUSWERTUNG ALS LOG:    "+result.value.movementItem[i].title);
                }*/
            }
        };

        firebase.query(
            onQueryEvent,
            "/user/"+BackendService.token+"/piece/"+this.pieceId,
            {
                // set this to true if you want to check if the value exists or just want the event to fire once
                // default false, so it listens continuously.
                // Only when true, this function will return the data in the promise as well!
                singleEvent: true,
                // order by company.country
                orderBy: {
                    type: firebase.QueryOrderByType.CHILD,
                    value: 'since' // mandatory when type is 'child'
                }
            }
        );

        /*  ////////////////////////
            /////  NOT WORKING /////
        */  ////////////////////////

        let searchContainer = <View>this.searchContainer.nativeElement;
        let pieceContainer = <View>this.pieceContainer.nativeElement;
        let scrollview = <View>this.scrlView.nativeElement;

        var len = this.movementArray.length;
                for (let i = 0; i < len; i++) {
                    this.pieceMovementArray.push({
                        title: this.movementArray[i],
                        state: 0
                    });
                }

        console.log("HIER::: "+this.pieceMovementArray);

        this.currentView = 2;
        
        scrollview.style.borderBottomColor = new Color("#00ffed");
        searchContainer.style.visibility = "collapse";
        pieceContainer.style.visibility = "visible";
    }

    imageSource(movement) {
        console.log("MOVEMENT 1: " + movement);
        if (movement.state == 1) {
            return "res://li_checked";
        } else {
            return "res://li_unchecked";
        }
    }

    onMovementItemTap(movement) {
        console.log("MOVEMENT 2: " + movement.state + " // " + movement.title);
        if(movement.state == 1) {
            movement.state = 0;
        } else {
            movement.state = 1;
        }
    }

    addPiece(){
        console.log("ok");
        let i;
        let sP = this.pieceData[this.pieceDataId];
        let piecePracticeMovements: any[];
        let piecePracticeMovementsAmount: number = 0;
        for(i = 0; i < this.pieceMovementArray.length; i++){
            if(this.pieceMovementArray[i].state){
                //piecePracticeMovements.push([{movementNumber: i, movementTitle: this.pieceMovementArray[i].title}]);
                piecePracticeMovementsAmount += i;
            }
        }
        
        let piecePracticeArray = {pieceTitle: sP.piece_title, pieceWorkNumber: sP.piece_work_number, movementItem: this.pieceMovementArray, movementItemAmount: piecePracticeMovementsAmount};
        console.log(piecePracticeArray.pieceTitle, piecePracticeArray.pieceWorkNumber);


        firebase.setValue(
            '/user/'+BackendService.token+'/piece/'+this.pieceId,
            piecePracticeArray
        );
        console.log("SUCCESS");

    }

    backEvent(args) {
        if(this.currentView == 0){
            return;
        } else {
            args.cancel = true;
        }

        if(this.currentView == 1){
            // IF PIECE SEARCH (1), THEN BACK TO COMPOSER SEARCH (0)
            this.currentView -= 1;
            let searchComposerList = <View>this.searchComposerList.nativeElement;
            let searchPieceList = <View>this.searchPieceList.nativeElement;
            let sbComposer = <View>this.sbComposer.nativeElement;
            let sbPiece = <View>this.sbPiece.nativeElement;

            searchPieceList.style.visibility = "collapse";
            sbPiece.style.visibility = "collapse";

            searchComposerList.style.visibility = "visible";
            sbComposer.style.visibility = "visible";
            
            this.searchPhrase = null;
            sbComposer.focus();
        } else if(this.currentView == 2) {
            // IF PIECE ITEM (2), THEN BACK TO PIECE SEARCH (1)
            this.currentView -= 1;
            let searchContainer = <View>this.searchContainer.nativeElement;
            let pieceContainer = <View>this.pieceContainer.nativeElement;
            let sbPiece = <View>this.sbPiece.nativeElement;

            pieceContainer.style.visibility = "collapse";
            searchContainer.style.visibility = "visible";

            // RESET VALUES
            this.pieceArray = [];
            this.searchPhrase = null;
            sbPiece.focus();
        }
    }
}