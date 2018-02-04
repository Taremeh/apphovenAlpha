import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from "@angular/core";
import { View } from "ui/core/view";
import { Color } from "color";
import { firestore } from "nativescript-plugin-firebase";
const firebase = require("nativescript-plugin-firebase/app");
import { BackendService, PieceService } from "../../../shared";
import { Observable as RxObservable } from 'rxjs/Observable';
import * as fs from "file-system";
import { TextField } from "ui/text-field";

// Maybe not needed anymore?
import { knownFolders, File } from 'file-system';

import * as application from "application";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
// import * as fs from 'file-system';
import * as app from 'application';
import * as color from 'color';
import * as platform from 'platform';
import * as dialogs from 'ui/dialogs';
import { Page } from 'ui/page';
import { Slider } from 'ui/slider';
// import { SnackBar } from 'nativescript-snackbar';
import { SegmentedBarItem } from "ui/segmented-bar";
import { TNSRecorder, TNSPlayer, AudioPlayerOptions, AudioRecorderOptions } from 'nativescript-audio';
import { RouterExtensions } from "nativescript-angular/router";
import { android as android } from "application";
// UI Plugin
import { SwissArmyKnife } from "nativescript-swiss-army-knife";
import * as Toast from "nativescript-toast";

@Component({
    selector: "ah-audio-recorder",
    templateUrl: "pages/audio-recorder/audio-recorder/audio-recorder.component.html",
    styleUrls: ["pages/audio-recorder/audio-recorder/audio-recorder-common.css"]
})

export class AudioRecorderComponent implements OnInit, OnDestroy {
    public isPlaying: boolean;
    public isRecording: boolean;
    public recordedAudioFile: string;
    private recorder;
    private player;
    private audioSessionId;
    private page;
    private meterInterval: any;
    private currentMeter;
    private meterLine: Array<any>;
    private meterData: Array<any>;
    private recordButtonText: string = "Record Audio";
    private selectedIndex;
    private showPicker: boolean = false;
    private recordingStart;
    private recordingEnd;
    private audioPath;

    private fileName: string;

    public audioEntities: Array<any>;

    // PIECE DATA
    private pieceArray: Array<any>;
    private pieceIdArray: Array<any>;
    private pieceMovementArray: Array<any>;
    private pieceNameArray: Array<any>;
    private noPiecesFound: boolean;

    // APP LOGIC
    private fileCreated: boolean;

    // Observable
    private listenerUnsubscribe: () => void;

    // Icons
    private isRecordingIcon = String.fromCharCode(0xf111);
    private isNotRecordingIcon = String.fromCharCode(0xf10c);

    // OTHER UI
    private showPickerReplacement: boolean;

    // Audiometer UI Component
    private signalColor: Array<any>;

    // Tags
    private tag: Array<boolean>;
    

    // @ViewChild("ahMainContainer") ahMainContainer: ElementRef;
    // @ViewChild("meterLineContainer") meterLineContainer: ElementRef;
    // @ViewChild("meterLineListView") meterLineListView: ElementRef;
    @ViewChild("audioMeterComponent") audioMeterComponent: ElementRef;
    @ViewChild("pieceSelectContainer") pieceSelectContainer: ElementRef;
    @ViewChild("pieceSelectContainerBottom") pieceSelectContainerBottom: ElementRef;
    @ViewChild("recordButton") recordButton: ElementRef;


    constructor(private _ngZone: NgZone, private _routerExtensions: RouterExtensions, private _page: Page) {
        // Audiometer UI Component 8B3333
        this.signalColor = [false,false,false,false,false,false];

        // Tags: "PRACTICE": false | "CONCERT": false
        this.tag = [false, false];

        this.player = new TNSPlayer();
        this.recorder = new TNSRecorder();
        //this.set('currentVolume', 1);
        this.audioEntities = [];
        this.meterLine = [];
        this.audioPath = fs.knownFolders.documents().getFolder("audio");
        console.log("P1: " + fs.path.normalize(this.audioPath.path));
        console.log("PATH: "+this.audioPath);

        // Fetching Firebase Piece-Information
        // this.loadPieceInformation();
        this.firestoreListen();
    }

    ngOnInit(){

        // Simulate Transition-Delay
        setTimeout(() => {
            // Set StatusBarColor
            SwissArmyKnife.setAndroidStatusBarColor("#303030");
        }, 100);

        // Hide Action-Bar
        this._page.actionBarHidden = true;

        application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
            console.log("BACK BUTTON EVENT TRIGGERED");
            if(this.isRecording || this.fileCreated){
                data.cancel = true;
                let options = {
                    title: "Abort recording?",
                    message: "Are you sure you want to stop recording without saving?",
                    okButtonText: "Delete recording",
                    cancelButtonText: "No, stay!",
                };
                dialogs.confirm(options).then((result: boolean) => {
                    if(result){
                        // Remove & go back

                        // Reset StatusBar Color
                        SwissArmyKnife.setAndroidStatusBarColor("#D04F4F");

                        // Stop Recording
                        if(this.isRecording) {
                            this.stopRecord();
                        }

                        // Delete Recorded File
                        this.deleteRecording();
                        this._routerExtensions.back();
                    } else {
                        // Stay
                    }
                });
            } else {
                // Reset StatusBar Color
                SwissArmyKnife.setAndroidStatusBarColor("#D04F4F");
            }
        });
    
    }

    recordToggle(){
        // let ahMainContainer = <View>this.ahMainContainer.nativeElement;
        // let meterLineContainer = <View>this.meterLineContainer.nativeElement;
        let audioMeterComponent = <View>this.audioMeterComponent.nativeElement;
        let pieceSelectContainer = <View>this.pieceSelectContainer.nativeElement;
        let pieceSelectContainerBottom = <View>this.pieceSelectContainerBottom.nativeElement;
        let recordButton = <View>this.recordButton.nativeElement;

        let regularBackgroundColor = new Color("#FAFAFA");
        let regularButtonColor;

        let recordingBackgroundColor = new Color("#232323");
        let recordingButtonColor = new Color("#9E9E9E");

        if(this.isRecording){
            // Stop Recording => Now save it

            if(this.noPiecesFound){
                this.showPickerReplacement = true;
            } else {
                this.showPicker = true;
            }
            
            // ahMainContainer.style.backgroundColor = regularBackgroundColor;
            recordButton.style.backgroundColor = recordingButtonColor;
            // meterLineContainer.style.visibility = "collapse";
            audioMeterComponent.style.visibility = "collapse";
            pieceSelectContainer.style.visibility = "visible";
            pieceSelectContainerBottom.style.visibility = "visible";
            this.stopRecord();

            // Stop Timer
            let d = new Date();
            this.recordingEnd = d.getTime();

            this.recordButtonText = "Save Recording";
        } else if(!this.isRecording) {
            // Start Recording
            // ahMainContainer.style.backgroundColor = recordingBackgroundColor;
            this.startRecord();

            // Start Timer
            let d = new Date();
            this.recordingStart = d.getTime();
            this.recordButtonText = "Stop Audio Recording";
        }
    }


    public startRecord() {
        if (TNSRecorder.CAN_RECORD()) {
            // Clear MeterValues
            this.meterData = [];
            this.meterLine = [];
            var audioFolder = this.audioPath; // knownFolders.currentApp().getFolder("audio");
            console.log(JSON.stringify(audioFolder));

            let androidFormat;
            let androidEncoder;
            if (platform.isAndroid) {
                // m4a
                // static constants are not available, using raw values here
                // androidFormat = android.media.MediaRecorder.OutputFormat.MPEG_4;
                androidFormat = 2;
                // androidEncoder = android.media.MediaRecorder.AudioEncoder.AAC;
                androidEncoder = 3;
            }

            // SET FILE NAME
            let d = new Date();     
            let day = d.getDate();
            let month = d.getMonth()+1;
            let year = d.getFullYear();
            let hours = d.getHours();
            let minutes = d.getMinutes();
            let seconds = d.getSeconds();

            this.fileName = "apphoven-rec-" + day + "-" + month + "-" + year + "-" + hours + "-" + minutes + "-" + seconds;
            console.log("FILENAME: " + this.fileName);

            let recordingPath = `${audioFolder.path}/${this.fileName}.${this.platformExtension()}`;
            console.log("REC Path: " + recordingPath);

            let recorderOptions: AudioRecorderOptions = {

                sampleRate: 44100,

                bitRate: 128000,

                filename: recordingPath,

                format: androidFormat,

                encoder: androidEncoder,

                metering: true,

                infoCallback: (infoObject) => {
                console.log("GUT " + JSON.stringify(infoObject));
                },

                errorCallback: (errorObject) => {
                console.log("SCHLECHT " + JSON.stringify(errorObject));
                }
            };

            console.log(JSON.stringify(recorderOptions));

            let that = this;
            this.recorder.start(recorderOptions).then((result) => {
                //this.set("isRecording", true);
                this.isRecording = true;
                if (recorderOptions.metering) {
                this.initMeter();
                }
                console.log("GUT!");
            }, (err) => {
                this.isRecording = false;
                //this.set("isRecording", false);
                this.resetMeter();
                dialogs.alert(err);
                console.log(err);
                console.log("SCHLECHT");
            });
        } else {
            
            dialogs.alert("This device cannot record audio.");
        }
    }

    public stopRecord() {
        this.resetMeter();
        this.recorder.stop().then(() => {
            //this.set("isRecording", false);
            this.isRecording = false;
            this.fileCreated = true;
            //this._SnackBar.simple("Recorder stopped");
            this.resetMeter();
        }, (ex) => {
            console.log(ex);
            this.isRecording = false;
            //this.set("isRecording", false);
            this.resetMeter();
        });
    }

    private initMeter() {
        this.resetMeter();
        // let meterLineListView = <View>this.meterLineListView.nativeElement;
        let i: number = 1;
        // meterLineListView.android.setVerticalScrollBarEnabled(false);
        // meterLineListView.android.setTranscriptMode(2);

        this.meterInterval = setInterval(() => {
            let currentMeter = this.recorder.getMeters();
            console.log(currentMeter);
            if(currentMeter == 0){
                currentMeter = 1;
            }

            // Push new value to MeterData (data)
            this.meterData.push(currentMeter);

            this.signalColor = [false,false,false,false,false,false];
            let meterMaxValue = 32800;

            switch(true) { 
                case (currentMeter > (10/12*meterMaxValue)) : { 
                    console.log("SWITCH 1");
                    this.signalColor = [true,true,true,true,true,true];
                    break;
                }
                case (currentMeter > (9/12*meterMaxValue)) : { 
                    this.signalColor = [true,true,true,true,true,false];
                    console.log("SWITCH 2");
                    break;
                }
                case (currentMeter > (4/6*meterMaxValue)) : { 
                    this.signalColor = [true,true,true,true,false,false];
                    console.log("SWITCH 3");
                    break;
                }
                case (currentMeter > (3/6*meterMaxValue)) : { 
                    this.signalColor = [true,true,true,false,false,false];
                    console.log("SWITCH 4");
                    break;
                }
                case (currentMeter > (2/6*meterMaxValue)) : { 
                    this.signalColor = [true,true,false,false,false,false];
                    console.log("SWITCH 5");
                    break;
                }
                case (currentMeter > (1/12*meterMaxValue)) : { 
                    this.signalColor = [true,false,false,false,false,false];
                    console.log("SWITCH 6");
                    break; 
                }
             } 


            // Push new value to MeterLine (display)
            this.meterLine.push({meterValue: currentMeter});

        }, 500);
    }

    private resetMeter() {
        if (this.meterInterval) {
        clearInterval(this.meterInterval);
        this.meterInterval = undefined;
        }
    }

    public getFile() {
        try {
            var audioFolder = this.audioPath; //knownFolders.documents().getFolder("audio");
            var recordedFile = audioFolder.getFile(`recording.${this.platformExtension()}`);
            console.log(JSON.stringify(recordedFile));
            console.log('recording exists: ' + File.exists(recordedFile.path));
            //this.set("recordedAudioFile", recordedFile.path);
        } catch (ex) {
            console.log(ex);
        }
    }


    public playRecordedFile(args) {

        var audioFolder = this.audioPath; // knownFolders.documents().getFolder("audio");
        var recordedFile = audioFolder.getFile(`recording.${this.platformExtension()}`);
        console.log("RECORDED FILE : " + JSON.stringify(recordedFile));

        var playerOptions: AudioPlayerOptions = {
            audioFile: `~/audio/recording2.${this.platformExtension()}`,
            loop: false,
            completeCallback: () => {
                //this._SnackBar.simple("Audio file complete");
                //this.set("isPlaying", false);
                if (!playerOptions.loop) {
                this.player.dispose().then(() => {
                    console.log('DISPOSED');
                }, (err) => {
                    console.log(err);
                });
                }

            },

            errorCallback: (errorObject) => {
                console.log(JSON.stringify(errorObject));

                //dialogs.alert('Error callback');
                //this.set("isPlaying", false);
            },

            infoCallback: (infoObject) => {
                console.log(JSON.stringify(infoObject));

                //dialogs.alert('Info callback');
            }
        };


        this.player.playFromFile(playerOptions).then(() => {
        //this.set("isPlaying", true);
        }, (err) => {
        console.log(err);
        //this.set("isPlaying", false);
        });

    }



    /***** AUDIO PLAYER *****/

    public playAudio(filepath: string, fileType: string) {

        try {
            var playerOptions = {
                audioFile: filepath,

                completeCallback: () => {
                    //this._SnackBar.simple("Audio file complete");

                    this.player.dispose().then(() => {
                        //this.set("isPlaying", false);
                        console.log('DISPOSED');
                    }, (err) => {
                        console.log('ERROR disposePlayer: ' + err);
                    });
                },

                errorCallback: (errorObject) => {
                    //this._SnackBar.simple('Error occurred during playback.');
                    console.log(JSON.stringify(errorObject));
                    //this.set("isPlaying", false);
                },

                infoCallback: (args) => {
                    console.log(JSON.stringify(args));

                    //dialogs.alert('Info callback: ' + args.info);
                    console.log(JSON.stringify(args));
                }
            };

            //this.set("isPlaying", true);

            if (fileType === 'localFile') {
                    this.player.playFromFile(playerOptions).then(() => {
                    //this.set("isPlaying", true);
                }, (err) => {
                    console.log(err);
                    //this.set("isPlaying", false);
                });
            } else if (fileType === 'remoteFile') {
                    this.player.playFromUrl(playerOptions).then(() => {
                    //this.set("isPlaying", true);
                }, (err) => {
                    console.log(err);
                    //this.set("isPlaying", false);
                });
            }
        } catch (ex) {
            console.log(ex);
        }
    }


    /**
     * PLAY REMOTE AUDIO FILE
     */
    public playRemoteFile(args) {
        console.log('playRemoteFile');
        var filepath = 'http://www.noiseaddicts.com/samples_1w72b820/2514.mp3';

        this.playAudio(filepath, 'remoteFile');
    }


    public resumePlayer() {
        console.log(JSON.stringify(this.player));
        this.player.resume();
    }

    /**
     * PLAY LOCAL AUDIO FILE from app folder
     */
    public playLocalFile(args) {
        let filepath = '~/audio/angel.mp3';

        this.playAudio(filepath, 'localFile');

    }






    /**
     * PAUSE PLAYING
     */
    public pauseAudio(args) {
        this.player.pause().then(() => {
            this.isPlaying = false;
            //this.set("isPlaying", false);
        }, (err) => {
            console.log(err);
            this.isPlaying = true;
            //this.set("isPlaying", true);
        });
    }

    public stopPlaying(args) {
        this.player.dispose().then(() => {
            //this._SnackBar.simple("Media Player Disposed");
        }, (err) => {
            console.log(err);
        });
    }


    /**
     * RESUME PLAYING
     */
    public resumePlaying(args) {
        console.log('START');
        this.player.start();
    }


    private platformExtension() {
        //'mp3'
        return `${app.android ? 'm4a' : 'caf'}`;
    }



    selectedIndexChanged(picker){
        this.selectedIndex = picker.selectedIndex;
    }

    meterLineTap() {
        console.log("MeterLine Tapped");
    }

    public tapTag(type: string){
        if(type == "practice"){
            // Check if Tag already selected
            if(this.tag[0] == true) {
                // Tags: Reset
                this.tag = [false, false];
            } else {
                // Tags: "PRACTICE": true | "CONCERT": false
                this.tag = [true, false];
            }
        } else if(type == "concert") {
            // Check if Tag already selected
            if(this.tag[1] == true) {
                // Tags: Reset
                this.tag = [false, false];
            } else {
                // Tags: "PRACTICE": false | "CONCERT": true
                this.tag = [false, true];
            }
        }
    }

    saveRecording() {
        let duration = this.recordingEnd - this.recordingStart;
        let pieceId;
        let movementId;
        let firebaseRecordingItem;
        let recordingDate = this.recordingStart;
        let userRecordingTitle = this._page.getViewById<TextField>("userRecordingTitle").text;
        let recordingType;
        if(this.tag[0] == true){
            recordingType = "practice";
        } else if (this.tag[1] == true){
            recordingType = "concert";
        } else {
            recordingType = undefined;
        }

        // Shrink MeterData if > 20  
        if(this.meterData.length > 20){
            // Max MeterBlocks to display
            let maxVal = 20;
            let delta = Math.floor(this.meterData.length / maxVal);
            let tmpArray = [];
            for (let i = 0; i < this.meterData.length; i=i+delta) {
                tmpArray.push(this.meterData[i]);
            }

            // Reset
            this.meterData = [];

            // Refill with max. 100 elements
            this.meterData = tmpArray;
        }

        if(this.selectedIndex == null){
            firebaseRecordingItem = {
                // NO PIECE & NO MOVEMENTS EXIST
                'duration': duration,
                'recordingTitle': userRecordingTitle,
                'recordingType': recordingType,
                'fileName': this.fileName,
                'audioMeterLine': this.meterData,
                'fileLocation': 0,
                'recordingDate': recordingDate
            }
        } else {
            console.log("SELECTED INDEX: " + this.selectedIndex);
            console.log("DATA: " + this.pieceArray[this.selectedIndex].pieceId);

            pieceId = this.pieceArray[this.selectedIndex].pieceId;
            if(this.pieceArray[this.selectedIndex].movementId || this.pieceArray[this.selectedIndex].movementId == 0) {
                console.log("EXISTS: " + this.pieceArray[this.selectedIndex].movementId);
                // MOVEMENT EXISTS
                movementId = this.pieceArray[this.selectedIndex].movementId;
                firebaseRecordingItem = {
                    'duration': duration,
                    'pieceId': pieceId,
                    // pieceTitle (including movement) only TEMPORARY
                    'pieceTitle': this.pieceNameArray[this.selectedIndex],
                    'movementId': movementId,
                    'recordingTitle': userRecordingTitle,
                    'recordingType': recordingType,
                    'fileName': this.fileName,
                    'audioMeterLine': this.meterData,
                    'fileLocation': 0,
                    'recordingDate': recordingDate
                }
            } else {
                console.log("NOT exists: " +  this.pieceArray[this.selectedIndex].movementId);
                // ONLY PIECE (No movements)
                firebaseRecordingItem = {
                'duration': duration,
                'pieceId': pieceId,
                // pieceTitle (including movement) only TEMPORARY
                'pieceTitle': this.pieceNameArray[this.selectedIndex],
                'recordingTitle': userRecordingTitle,
                'recordingType': recordingType,
                'fileName': this.fileName,
                'audioMeterLine': this.meterData,
                'fileLocation': 0,
                'recordingDate': recordingDate
            }
            }
        }
    
        let that = this;
        const recordingCollection = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("recording");

        recordingCollection.doc(this.fileName)
            .set(firebaseRecordingItem)
            .then(
                function (result) {
                    console.log("SUCCESSFULLY SAVED META-DATA. REDERECTING TO ANALYZER...");
                    // BackendService: Update lastPieceId & lastMovementId (DEL)
                    // BackendService.lastPieceId = Number(that.routerParamIds['pieceId']);
                    // BackendService.lastMovementId = Number(that.routerParamIds['movementId']);
                    that._routerExtensions.navigate(["/audio-analyzer/"+that.fileName+"/backToHome"], { clearHistory: true });
                }
            );

        /*firebase.setValue(
                '/user/'+BackendService.token+'/recording/'+this.fileName,
                firebaseRecordingItem
            ).then(
                function (result) {
                    // BackendService: Update lastPieceId & lastMovementId (DEL)
                    // BackendService.lastPieceId = Number(that.routerParamIds['pieceId']);
                    // BackendService.lastMovementId = Number(that.routerParamIds['movementId']);
                    that._routerExtensions.navigate(["/audio-analyzer/"+that.fileName+"/backToHome"], { clearHistory: true });
                }
            );
        */
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
        this.pieceArray = [];
        this.pieceNameArray = [];
        this.noPiecesFound = true;

        // Check if Snapshot contains Pieces (snapshot.docsSnapshots: [])
        if(snapshot.docSnapshots.length !== 0){

            snapshot.forEach(piece => {
                console.log("The Result: " + JSON.stringify(piece) + "\n\n");
                console.log("> PIECE SUCCESSFULLY RETRIEVED.");
                console.log(">> Analysing Data \n");
                console.log(">>> Piece ID: " + piece.id);
                console.log(">>> Piece Value: " + JSON.stringify(piece.data()));
                piece.data().movementItem ? console.log(">>> Movements: " + JSON.stringify(piece.data().movementItem.length) + "\n\n") : console.log(">>> Movements: 0\n\n");
            
                // Check if Piece is actually available to select (!= archived)
                if(!piece.data().archived) {
                    this.noPiecesFound = false;

                    if(piece.data().movementItem){
                        // Piece contains Movements
                        console.log("MOVEMENT-ITEMS FOUND");

                        // Count Movements of Pieced
                        let movementAmount = piece.data().movementItem.length;

                        // Add each movement (with practice state = 1) of piece to selectionPieceArray
                        for (let iMov = 0; iMov < movementAmount; iMov++) {
                            if(piece.data().movementItem[iMov].state == 1){
                                this._ngZone.run(() => {
                                    this.pieceArray.push({
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

                                    this.pieceNameArray.push(piece.data().pieceTitle + " | " + piece.data().movementItem[iMov].title);
                                })
                            }
                        }
                        
                    } else {
                        // Piece does not contain movements
                        // Add piece to selectionPieceArray
                        this._ngZone.run(() => {
                            this.pieceArray.push({
                                pieceId: piece.id,
                                pieceTitle: piece.data().pieceTitle,
                                lastUsed: piece.data().lastUsed,
                                iconCode: String.fromCharCode(0xf11a), 
                                iconState: -1,
                                iconColor: "#afafaf",
                                durationSliderValue: 0,
                                state: false
                            });

                            this.pieceNameArray.push(piece.data().pieceTitle);
                        });
                    }
                }
            });

            this._ngZone.run(() => {
                // Sort array by lastUsed. Last Used at the top
                this.pieceArray.sort(function(a, b) {
                    return parseFloat(b.lastUsed) - parseFloat(a.lastUsed);
                });
            });

        }
    }

    /*loadPieceInformation() {
        // CLEARING
        this.pieceArray = [];
        this.pieceIdArray = [];
        this.pieceNameArray = [];
        this.pieceMovementArray = [];

        firebase.query(
            (result) => {
                if (result) {
                    console.log("Event type: " + result.type);
                    console.log("Key: " + result.key);
                    console.log("Value: " + JSON.stringify(result.value));

                    if(result.value){
                        console.log("PIECE-ITEMS FOUND");
                        var lenPieces = Object.keys(result.value).length;
                        for (let i = 0; i < lenPieces; i++) {
                            this.pieceIdArray.push(Object.keys(result.value)[i]);
                        }

                        for (let i = 0; i < this.pieceIdArray.length; i++) {
                            if(result.value[this.pieceIdArray[i]].movementItem){
                                console.log("MOVEMENT-ITEMS FOUND");

                                // CLEARING
                                this.pieceMovementArray = [];

                                let lenMovements = result.value[this.pieceIdArray[i]].movementItem.length;
                                for (let iMov = 0; iMov < lenMovements; iMov++) {
                                    if(result.value[this.pieceIdArray[i]].movementItem[iMov].state == 1){

                                        this._ngZone.run(() => {
                                            this.pieceArray.push({
                                                pieceId: this.pieceIdArray[i],
                                                movementId: result.value[this.pieceIdArray[i]].movementItem[iMov].id,
                                                pieceTitle: result.value[this.pieceIdArray[i]].pieceTitle,
                                                movementTitle: result.value[this.pieceIdArray[i]].movementItem[iMov].title,
                                                lastUsed: result.value[this.pieceIdArray[i]].movementItem[iMov].lastUsed,
                                                iconCode: String.fromCharCode(0xf11a), 
                                                iconState: -1,
                                                iconColor: "#afafaf",
                                                durationSliderValue: 0,
                                                state: false
                                            });

                                            this.pieceNameArray.push(result.value[this.pieceIdArray[i]].pieceTitle + " | " + result.value[this.pieceIdArray[i]].movementItem[iMov].title);
                                        })
                                    }
                                }
                            } else {
                                this._ngZone.run(() => {
                                    this.pieceArray.push({
                                        pieceId: this.pieceIdArray[i],
                                        pieceTitle: result.value[this.pieceIdArray[i]].pieceTitle,
                                        lastUsed: result.value[this.pieceIdArray[i]].lastUsed,
                                        iconCode: String.fromCharCode(0xf11a), 
                                        iconState: -1,
                                        iconColor: "#afafaf",
                                        durationSliderValue: 0,
                                        state: false
                                    });
                                    this.pieceNameArray.push(result.value[this.pieceIdArray[i]].pieceTitle);
                                });
                            }
                        }

                    } else {
                        //result.value.movementItem.length = 0;
                        this.noPiecesFound = true;
                        console.log("NO PIECES FOUND");
                    }

                } else {
                    this.noPiecesFound = true;
                    console.log("NO PIECES FOUND");
                }
            },
            "/user/" + BackendService.token + "/piece",
            {
                singleEvent: true,
                orderBy: {
                    type: firebase.QueryOrderByType.CHILD,
                    value: 'since' // mandatory when type is 'child'
                }
            }
        );
    }*/

    deleteRecording(){
        let audioFolder = this.audioPath // knownFolders.documents().getFolder("audio");
        let deleteFile = audioFolder.getFile(this.fileName);
        if (deleteFile) {
            deleteFile.remove()
                .then(res => {
                // Success removing the file.
                //this.resultMessage = "File successfully deleted!";
                console.log("Sucessfully deleted");
            }).catch(err => {
                console.log(err.stack);
            });
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

    ngOnDestroy(){
        // Reset StatusBar Color
        SwissArmyKnife.setAndroidStatusBarColor("#D04F4F");

        if(this.isRecording){
            this.stopRecord();
        }

        this.firestoreStopListening();
        application.android.off(AndroidApplication.activityBackPressedEvent);
        console.log("AudioRecorder - ngOnDestroy()");
    }
}