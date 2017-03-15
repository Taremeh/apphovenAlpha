import { Component, OnInit, ViewChild, ElementRef, NgZone } from "@angular/core";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import { TextField } from "ui/text-field";
import { HttpService, BackendService } from "../../../shared";
import { Color } from "color";
import * as application from "application";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import firebase = require("nativescript-plugin-firebase");
import { Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";

@Component({
    selector: "ah-addpiece",
    templateUrl: "pages/piece/addpiece/addpiece.component.html",
    styleUrls: ["pages/piece/addpiece/addpiece-common.css"],
})
export class AddPieceComponent implements OnInit {

    public composerArray: Array<any>; // For Listview
    public composerData: Array<any>; // To fetch data
    public composerName: string;
    public composerId: number;

    public pieceArray: Array<any>; // For Listview
    public pieceData: Array<any>; // To fetch data
    public pieceDataId: number; // List-View Index
    public pieceId: number; // Actual piece-id
    public piecePreviewItemText: string; // shown below piece title on instant search results
    public pieceItemText: Array<any>; // Array with Piece-Informations to display

    public movementArray: Array<any>; // If exist, fetch movements from DB
    public pieceMovementArray: Array<any>; // Generate new movement array from 'movementArray' -> error prevention

    // Initializing user input vars
    public searchPhraseComposer;
    public searchPhrasePiece;
    public searchHint = "Mozart";

    // Navigation Helper Variable
    public currentView: number = 0;

    constructor(private _page: Page, private _httpService: HttpService, private _router: Router) {
        // Initializing Arrays
        this.composerArray = [];
        this.composerData = [];
        this.pieceArray = [];
        this.pieceData = [];
        this.pieceItemText = [];
        this.movementArray = [];
        this.pieceMovementArray = [];
        this.searchPhrasePiece = "";
    }

    // Initializing Native Elements
    @ViewChild("searchContainer") searchContainer: ElementRef;
    @ViewChild("pieceContainer") pieceContainer: ElementRef;
    @ViewChild("searchComposerList") searchComposerList: ElementRef;
    @ViewChild("searchPieceList") searchPieceList: ElementRef;
    @ViewChild("sbComposer") sbComposer: ElementRef;
    @ViewChild("sbPiece") sbPiece: ElementRef;
    @ViewChild("scrlView") scrlView: ElementRef;

    ngOnInit() {
        // Hide Action bar
        this._page.actionBarHidden = true;

        // Create onBackButtonPressed-Listener
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
        this.pieceItemText = [];
        this.pieceItemText = this.pieceArray[args.index];
        console.log("PIECE ARRAY RAW: "+JSON.stringify(this.pieceArray[args.index]));
        console.log("PIECE ARRAY CREATED: "+JSON.stringify(this.pieceItemText));
        this.showPieceItem(args.index);
    }

    searchPiece(pieceTitle: string) {
        if((pieceTitle+"").length > 3) {
                this._httpService.getData(2, pieceTitle, this.composerId).subscribe((res) => {
                    console.log(JSON.stringify(res));
                    // this.searchResp[0] = JSON.stringify(res.composer[0].name_de); // Currently: Display German Name
                    this.pieceData = res;
                    this.movementArray = [];
                    this.pieceArray = [];
                    let arrayText: string = "";
                                        
                    for (let i = 0; i < res.length; i++) {
                        this.pieceArray.push(res[i]);
                        if(this.pieceArray[i].piece_movement_title.substring("|")){
                            this.movementArray[i] = this.pieceArray[i].piece_movement_title.split("|");
                            this.pieceArray[i].piece_movement_text = "Movements: " + this.movementArray.join(", ");
                        }
                        if(this.pieceArray[i].piece_langauge){
                            arrayText += "Piece Language: " + this.pieceArray[i].piece_langauge + "\n";
                        }
                        if(this.pieceArray[i].piece_key){
                            arrayText += "Piece Key: " + this.pieceArray[i].piece_key + "\n";
                        }
                        this.pieceArray[i].piece_text = arrayText;
                        arrayText = "";

                        let pLengthCut = this.pieceArray[i].piece_title.length - (this.composerName.length + 2);
                        this.pieceArray[i].piece_title = this.pieceArray[i].piece_title.substring(0, pLengthCut);
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

        // UNSET PREVIOUS INPUT
        this.sbPiece.nativeElement.text = "";
        this.pieceArray = [];
        sbPiece.focus();
    }

    showPieceItem(indexNumber: number) {
        this.pieceMovementArray = [];

        firebase.query(
            (result) => {
                if (result) {
                    console.log("Event type: " + result.type);
                    console.log("Key: " + result.key);
                    console.log("Value: " + JSON.stringify(result.value));
                    if(this.movementArray[indexNumber]){
                        var len = this.movementArray[indexNumber].length;
                        if(result.value){
                            for (let i = 0; i < len; i++) {
                                this.pieceMovementArray.push({
                                    title: result.value.movementItem[i].title,
                                    state: result.value.movementItem[i].state
                                });
                                console.log(result.value.movementItem[i].title);
                            }
                        } else {
                            for (let i = 0; i < len; i++) {
                                this.pieceMovementArray.push({
                                    title: this.movementArray[indexNumber][i],
                                    state: 0
                                });
                            }
                        }
                    } else {
                        console.log("ARRAY EMPTY!");
                    }

                    let searchContainer = <View>this.searchContainer.nativeElement;
                    let pieceContainer = <View>this.pieceContainer.nativeElement;
                    let scrollview = <View>this.scrlView.nativeElement;

                    this.currentView = 2;
                    
                    scrollview.style.borderBottomColor = new Color("#00ffed");
                    searchContainer.style.visibility = "collapse";
                    pieceContainer.style.visibility = "visible";

                }
            },
            "/user/" + BackendService.token + "/piece/" + this.pieceId,
            {
                singleEvent: true,
                orderBy: {
                    type: firebase.QueryOrderByType.CHILD,
                    value: 'since'
                }
            }
        );   
    }

    imageSource(movement) {
        if (movement.state == 1) {
            return "res://li_checked";
        } else {
            return "res://li_unchecked";
        }
    }

    onMovementItemTap(movement) {
        if(movement.state == 1) {
            movement.state = 0;
        } else {
            movement.state = 1;
        }
    }

    addPiece(){
        let i;
        let sP = this.pieceData[this.pieceDataId];
        let piecePracticeMovements: any[];
        let piecePracticeMovementsAmount: number = 0;
        for(i = 0; i < this.pieceMovementArray.length; i++){
            if(this.pieceMovementArray[i].state){
                piecePracticeMovementsAmount += i;
            }
        }
        
        let piecePracticeArray = {pieceTitle: sP.piece_title, pieceWorkNumber: sP.piece_work_number, movementItem: this.pieceMovementArray, movementItemAmount: piecePracticeMovementsAmount};
        console.log(piecePracticeArray.pieceTitle, piecePracticeArray.pieceWorkNumber);

        let that = this;
        firebase.setValue(
            '/user/'+BackendService.token+'/piece/'+this.pieceId,
            piecePracticeArray
        ).then(
        function () {
            console.log("SUCCESS");
            BackendService.lastPieceId = Number(that.pieceId);
            //that._routerExtensions.navigate(["/piece-db/"+that.pieceId], { clearHistory: true });
            that._router.navigate(["/piece-db/"+that.pieceId+"/1"]);
        },
        function (error) {
            console.log("ERROR: " + error);
        });
    }

    // Handle Android Back-Button-Event (Navigation Logic)
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
            //this.pieceArray = [];
            sbPiece.focus();
        }
    }
}