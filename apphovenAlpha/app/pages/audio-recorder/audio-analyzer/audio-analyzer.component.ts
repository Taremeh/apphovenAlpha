import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from "@angular/core";
import { View } from "ui/core/view";
import { Color } from "color";
import { PageRoute } from "nativescript-angular/router";
const firebase = require("nativescript-plugin-firebase/app")
import { firestore } from "nativescript-plugin-firebase";
import { BackendService, PieceService, MillisecondTransformerPipe } from "../../../shared";
import { Observable as RxObservable } from 'rxjs/Observable';
import * as fs from "file-system";

// Maybe not needed anymore?
import { knownFolders, File } from 'file-system';

import * as application from "application";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
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


@Component({
    selector: "ah-audio-analyzer",
    templateUrl: "pages/audio-recorder/audio-analyzer/audio-analyzer.component.html",
    styleUrls: ["pages/audio-recorder/audio-analyzer/audio-analyzer-common.css"],
    providers: [MillisecondTransformerPipe]
})

export class AudioAnalyzerComponent implements OnInit, OnDestroy {

    
    private fbRecordingArray: Array<any>;
    private fbRecordingIdArray: Array<any>;
    private noRecordingFound: boolean = false;
    private fbRecordingMarks: Array<any>;
    private fbRecordingMarkIds: Array<any>;
    private routerParamId;

    // RECORDING DATA
    private duration;
    private pieceTitle;
    private fileName;
    private fileLocation;
    private recordingTitle;
    private recordingType;
    private audioMeterLine: Array<any>;
    private audioMeterColumns;
    private audioMeterMaxValue: number = 0;
    private audioPath;
    private recordingDate;
    private displayTitle;

    // ui
    private audioTime = 0;
    private playButton: string = "Play Recording";
    private addIcon = String.fromCharCode(0xf08d);
    private noMarks = false;

    // AUDIO PLUGIN
    private player;
    private isPlaying: boolean = false;
    private blockSeekTo: boolean;

    // Timeout
    private lastSetTime;
    private seekTimeout;

    // Observable
    private listenerUnsubscribe: () => void;
    private listenerUnsubscribeMarks: () => void;

    constructor(private _pageRoute: PageRoute, private _ngZone: NgZone, private _page: Page, private _msTransform: MillisecondTransformerPipe, private _routerExtensions: RouterExtensions){

        this.fbRecordingIdArray = [];
        this.fbRecordingArray = [];
        this.fbRecordingMarks = [];
        this.fbRecordingMarkIds = [];
        this.routerParamId = [];
        this.audioMeterLine = [];

        // Android Muisc Path => apphoven-recordings
        let androidMusicPath = android.os.Environment.getExternalStoragePublicDirectory(
            android.os.Environment.DIRECTORY_MUSIC).toString(); 
        // creates PATH for folder called apphoven-recordings in /Music (string value)
        let apphovenRecordingPath = fs.path.join(androidMusicPath, "apphoven-recordings");
        this.audioPath = apphovenRecordingPath;

        // Audio-Plugin
        this.player = new TNSPlayer();
        this.lastSetTime = 0;

        this._pageRoute.activatedRoute
        .switchMap(activatedRoute => activatedRoute.params)
        .forEach((params) => {
            this.routerParamId['recordingFileName'] = params['recordingFileName'];
            this.routerParamId['optionalParam'] = params['optionalParam'];
        });

        let audioPathFileInit = this.audioPath;
        console.log("PATH INFO: " + `${audioPathFileInit}/${this.routerParamId['recordingFileName']}.${this.platformExtension()}`);

        if(fs.File.exists(`${audioPathFileInit}/${this.routerParamId['recordingFileName']}.${this.platformExtension()}`)){
            console.log("FILE EXISTS");
            this.player.initFromFile({
                audioFile: `${audioPathFileInit}/${this.routerParamId['recordingFileName']}.${this.platformExtension()}`, // ~ = app directory
                loop: false,
                completeCallback: this._trackComplete.bind(this),
                errorCallback: this._trackError.bind(this)
            }).then(() => {

                this.player.getAudioTrackDuration().then((duration) => {
                    // iOS: duration is in seconds
                    // Android: duration is in milliseconds
                    this.duration = duration;
                    console.log(`recording duration:`, duration);
                });
            }, () => {
                console.log("ERROR LOADING !!!");
                console.log("PATH ERROR: " + `${audioPathFileInit}/${this.routerParamId['recordingFileName']}.${this.platformExtension()}`);
                /*this.noRecordingFound = true;
                this.notifyFileLoss();*/
            });
        } else {
            this.noRecordingFound = true;
            console.log("FILE DOES NOT EXIST");
            this.notifyFileLoss();
        } 

        // 1 => Init
        // this.loadPieceInformation(1);
        this.firestoreListen();
    }

    ngOnInit() {
        // Hide Action-Bar
        this._page.actionBarHidden = true;

        application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
            console.log("BACK BUTTON EVENT TRIGGERED");
            if(this.routerParamId['optionalParam'] == "backToHome") {
                data.cancel = true;
                this._routerExtensions.navigate(["/home"], { clearHistory: true });
            } else {
                data.cancel = false;
            }
        });
    }

    public togglePlay() {
        if(!this.noRecordingFound){
            if (this.player.isAudioPlaying()) {
                this.player.pause();
                clearTimeout(this.seekTimeout);
                this.playButton = "Play Recording";
            } else {
                this.player.play();
                this.playButton = "Pause Recording";
                this.timeout();
            }
        } else {
            this.notifyFileLoss();
        }
	}

    setTime(time){
        let d = new Date();
        this.audioTime = time;
        console.log(this.audioTime + " VS " + time);

        // Set MeterLine Color (RED if played / WHITE if not played)
        for (let i = 0; i < this.audioMeterLine.length; i++) {
            if(time > (this.duration / this.audioMeterLine.length * i)){
                // Played
                this.audioMeterLine[i].color = "#D04F4F";
            } else {
                // Ahead
                this.audioMeterLine[i].color = "#f7f7f7";
            }
        }

        // Highlight Mark, if available and time is in 5s range
        for (let i = 0; i < this.fbRecordingMarks.length; i++) {
            let markDistance = this.fbRecordingMarks[i].time - this.audioTime;
            if(markDistance < 1000 && markDistance > -2000){
                this.fbRecordingMarks[i].class = "mark-label mark-label-highlight";
            } else {
                this.fbRecordingMarks[i].class = "mark-label";
            }
        }


        if((d.getTime() - this.lastSetTime) < 200){
            this.player.seekTo(time);
        }

        this.lastSetTime = d.getTime();

    }

    addMark(){
        if(!this.noRecordingFound) {
            let that = this;
            let tappedTime = this.audioTime;
            console.log("tapped time: " + tappedTime + "   /    this.audioTime: " + this.audioTime);
            let recordingMarkCollection = firebase.firestore()
                .collection("user")
                .doc(BackendService.token)
                .collection("recording")
                .doc(this.routerParamId['recordingFileName'])
                .collection("mark");

            dialogs.prompt({
                title: "Add recording Mark",
                message: 'e.g. "Too fast", "Louder!" ...',
                okButtonText: "Add",
                cancelButtonText: "Cancel",
                inputType: dialogs.inputType.text
            }).then(function (r) {
                if(r.result) {
                    recordingMarkCollection.add({
                        time: tappedTime || 0,
                        text: r.text
                    }).then(() => {
                        console.log("MARK ADDED");
                    });
                    
                    /*firebase.push(
                        "/user/" + BackendService.token + "/recording/" + that.routerParamId['recordingFileName'] + "/mark",
                        {
                            time: tappedTime,
                            text: r.text
                        }
                    ).then((result) => {
                        // that.loadPieceInformation(0);
                    });*/
                }
                console.log("Dialog result: " + r.result + ", text: " + r.text);
            }, function(e) {
                console.log("SAVE ERROR! " + e);
            });
        } else {
            this.notifyFileLoss();
        }
    }

    onMarkTap(position: number) {
        let recordingMarkDocument = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("recording")
            .doc(this.routerParamId['recordingFileName'])
            .collection("mark")
            .doc(this.fbRecordingMarks[position].id);
        

        dialogs.confirm({
            title: "Mark " + this._msTransform.transform(this.fbRecordingMarks[position].time),
            message: this.fbRecordingMarks[position].text,
            okButtonText: "Okay",

            neutralButtonText: "Delete mark"
        }).then(result => {
            // result argument is boolean
            if(result === undefined){
                console.log("DELETE MARK");

                recordingMarkDocument.delete().then(() => {
                    console.log("MARK DELETED");
                });

                /*firebase.remove("/user/" + BackendService.token + "/recording/" + this.routerParamId['recordingFileName'] + "/mark/" + this.fbRecordingMarks[position].id).then( (r) => {
                    // this.loadPieceInformation(0);
                });*/
            }
            console.log("Dialog result: " + result);
        });
    }

    notifyFileLoss() {
        dialogs.alert({
            title: "Error: Recording not found",
            message: "This recording couldn't be found. It must have been deleted from your device externally. Therefore, the recording can't be played.",
            okButtonText: "Sorry"
        }).then(() => {
            console.log("Dialog closed!");
        });
    }

    /*
     * AUDIO PLUGIN 
     */

    private _trackComplete(args: any) {
        clearTimeout(this.seekTimeout);
		console.log('reference back to player:', args.player);
        this._ngZone.run(() => {
            this.playButton = "Replay Recording";
            this.audioTime = this.duration;
        });
		// iOS only: flag indicating if completed succesfully
		console.log('whether song play completed successfully:', args.flag);
	}

	private _trackError(args: any) {
        //console.log("PATH ERROR2: " + `${audioPathFileInit}/${this.routerParamId['recordingFileName']}.${this.platformExtension()}`);

        /*dialogs.alert({
            title: "Error: Audio-File not found",
            message: "Apphoven couldn't find the audio file on your device. It must have been deleted externally. Therefore, we're not able to play the recording",
            okButtonText: "Sorry"
        }).then(() => {
            console.log("Dialog closed!");
        });*/

		console.log('reference back to player:', args.player);
		console.log('the error:', args.error);

		// Android only: extra detail on error
		console.log('extra info on the error:', args.extra);
	}

    public getFile() {
        try {
            var audioFolder = this.audioPath; // knownFolders.currentApp().getFolder("audio");
            var recordedFile = audioFolder.getFile(`${this.routerParamId['recordingFileName']}.${this.platformExtension()}`);
            console.log(JSON.stringify(recordedFile));
            console.log('recording exists: ' + File.exists(recordedFile.path));
            //this.set("recordedAudioFile", recordedFile.path);
        } catch (ex) {
            console.log(ex);
        }
    }


    public playRecordedFile() {

        if(this.player.currentTime != 0) {
            this.resumePlayer();
        } else {

            var audioFolder = this.audioPath; // knownFolders.currentApp().getFolder("audio");
            var recordedFile = audioFolder.getFile(`recording.${this.platformExtension()}`);
            console.log("RECORDED FILE : " + JSON.stringify(recordedFile));

            var playerOptions: AudioPlayerOptions = {
                audioFile: `~/audio/${this.routerParamId['recordingFileName']}.${this.platformExtension()}`,
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
                    console.log("INFO");
                    //dialogs.alert('Info callback');
                }
            };


            this.player.playFromFile(playerOptions).then(() => {
            //this.duration = this.player.getAudioTrackDuration();
            console.log("DURATION: " + JSON.stringify(this.player.getAudioTrackDuration()));
            //this.set("isPlaying", true);
            console.log("PLAY");
            this.timeout();
            }, (err) => {
            console.log(err);
            //this.set("isPlaying", false);
            });
        }
    }


    public timeout(){
        let that = this;
        this.seekTimeout = setTimeout(function () {
            that.audioTime = that.player.currentTime;
            console.log("ZEIT " + that.audioTime);
            that.timeout();
        }, 500);
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
        let filepath = `~/audio/${this.routerParamId['recordingFileName']}.mp3`;

        console.log(filepath);

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


    public firestoreListen(): void {
        if (this.listenerUnsubscribe !== undefined) {
          console.log("Already listening");
          return;
        }
        
        // Define Firestore Recording Document
        let recordingDocument = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("recording")
            .doc(this.routerParamId['recordingFileName']);
        
        // Define Firestore Mark Collection
        let recordingMarkCollection = recordingDocument.collection("mark")
            .orderBy("time", "asc");

        // Firestore Recording Listener
        this.listenerUnsubscribe = recordingDocument.onSnapshot(doc => {
            if (doc.exists) {
                console.log("Handling Snapshot");
                console.log(`Document data: ${JSON.stringify(doc.data())}`);
                
                this.handleSnapshot(doc);
            } else {
                console.log("No such document!");
            }
        });

        // Firestore Mark Listener (of Recording)
        this.listenerUnsubscribeMarks = recordingMarkCollection.onSnapshot((snapshot: firestore.QuerySnapshot) => {
            if (snapshot.docSnapshots.length != 0) {
                console.log("Handling Snapshot (Marks)");
                this.handleSnapshotMarks(snapshot);
            } else {
                this._ngZone.run(() => {
                    // CLEARING
                    this.fbRecordingMarks = [];
                    this.fbRecordingMarkIds = [];
                    this.noMarks = true;
                    console.log("No Marks Found!");
                });
            }
        });


    }

    handleSnapshot(recording) {
        // CLEARING
        this.fbRecordingMarks = [];
        this.fbRecordingMarkIds = [];

        console.log("RECORDING ITEM FOUND");
        this._ngZone.run(() => {
            if(recording.data().recordingTitle != ""){
                console.log("RECORDING TITLE FOUND");
                this.displayTitle = recording.data().recordingTitle;
            } else if(recording.data().pieceTitle != ""){
                this.displayTitle = recording.data().pieceTitle;
            } else {
                this.displayTitle = "Recording (no title)"; 
            }

            // RETRIEVING ACTUAL AUDIO FILE LENGTH
            // this.duration = result.value.duration;
            this.pieceTitle = recording.data().pieceTitle != "" ? recording.data().pieceTitle : false;
            this.fileName = recording.data().fileName;
            this.fileLocation = recording.data().fileLocation;
            this.recordingTitle = recording.data().recordingTitle != "" ? recording.data().recordingTitle : false;
            this.recordingType = recording.data().recordingType;
            this.recordingDate = recording.data().recordingDate;
            
            for (let i = 0; i < recording.data().audioMeterLine.length; i++) {
                // Define audioMeterColumns
                if(i != 0){ this.audioMeterColumns += ","; }
                this.audioMeterColumns += "*";

                // Define audioMeterMaxValue
                if(recording.data().audioMeterLine[i] > this.audioMeterMaxValue) {
                    this.audioMeterMaxValue = recording.data().audioMeterLine[i];
                }
                
                this.audioMeterLine.push({
                    value: recording.data().audioMeterLine[i],
                    color: "#f7f7f7",
                    position: i
                });
            }
        });
    }

    handleSnapshotMarks(recordingMarks) {

        // CLEARING
        this.fbRecordingMarks = [];
        this.fbRecordingMarkIds = [];
        console.log("MARKS: " + JSON.stringify(recordingMarks));

        if(recordingMarks.docSnapshots.length !== 0){
            console.log("MARK-ITEMS FOUND");
            recordingMarks.forEach(mark => {
                this.fbRecordingMarks.push({
                    time: mark.data().time,
                    text: mark.data().text,
                    id: mark.id,
                    class: "mark-label"
                });
            });

            this._ngZone.run(() => {
                // Marks Found
                this.noMarks = false;
                // Define position
                for (let i = 0; i < this.fbRecordingMarks.length; i++) {
                    this.fbRecordingMarks[i].position = i;
                }
            });
        } else {
            this._ngZone.run(() => {
                // No Marks Found
                this.noMarks = true;
            });
        }
    }



    /*
     * FIREBASE LOADING
     */

    /*loadPieceInformation(type: number) {
        // CLEARING
        this.fbRecordingMarks = [];
        this.fbRecordingMarkIds = [];

        firebase.query(
            (result) => {
                if (result) {
                    console.log("Event type: " + result.type);
                    console.log("Key: " + result.key);
                    console.log("Value: " + JSON.stringify(result.value));

                    if(result.value){
                        this._ngZone.run(() => {
                            if(type == 1){
                                if(result.value.recordingTitle != ""){
                                    console.log("RECORDING TITLE FOUND");
                                    this.displayTitle = result.value.recordingTitle;
                                } else if(result.value.pieceTitle != ""){
                                    this.displayTitle = result.value.pieceTitle;
                                } else {
                                    this.displayTitle = "Recording (no title)"; 
                                }

                                // RETRIEVING ACTUAL AUDIO FILE LENGTH
                                // this.duration = result.value.duration;
                                this.pieceTitle = result.value.pieceTitle != "" ? result.value.pieceTitle : false;
                                this.fileName = result.value.fileName;
                                this.fileLocation = result.value.fileLocation;
                                this.recordingTitle = result.value.recordingTitle != "" ? result.value.recordingTitle : false;
                                this.recordingType = result.value.recordingType;
                                this.recordingDate = result.value.recordingDate;
                                
                                for (let i = 0; i < result.value.audioMeterLine.length; i++) {
                                    // Define audioMeterColumns
                                    if(i != 0){ this.audioMeterColumns += ","; }
                                    this.audioMeterColumns += "*";

                                    // Define audioMeterMaxValue
                                    if(result.value.audioMeterLine[i] > this.audioMeterMaxValue) {
                                        this.audioMeterMaxValue = result.value.audioMeterLine[i];
                                    }
                                    
                                    this.audioMeterLine.push({
                                        value: result.value.audioMeterLine[i],
                                        color: "#f7f7f7",
                                        position: i
                                    });
                                }
                            }
                            
                            if(result.value.mark != null){
                                console.log("MARKS FOUND");
                                this.noMarks = false;
                                this.fbRecordingMarkIds = [];
                                let recordingMarkings = Object.keys(result.value.mark).length;
                                console.log("RESULT LENGTH: " + recordingMarkings);
                                for (let i = 0; i < recordingMarkings; i++) {
                                    //console.log("SESSION ID(s): "+ Object.keys(result.value.mark)[i]);
                                    this.fbRecordingMarkIds.push(Object.keys(result.value.mark)[i]);
                                }

                                
                                for (let i = 0; i < this.fbRecordingMarkIds.length; i++) {
                                    // Define audioMeterColumns
                                    this.fbRecordingMarks.push({
                                        time: result.value.mark[this.fbRecordingMarkIds[i]].time,
                                        text: result.value.mark[this.fbRecordingMarkIds[i]].text,
                                        id: this.fbRecordingMarkIds[i],
                                        class: "mark-label"
                                    });
                                    console.log("ADDED: " + JSON.stringify(this.fbRecordingMarks[i]));
                                }

                                this._ngZone.run(() => {
                                    // Sort Recording Marks
                                    this.fbRecordingMarks.sort(function(a, b) {
                                            return parseFloat(a.time) - parseFloat(b.time);
                                    });

                                    // Define position
                                    for (let i = 0; i < this.fbRecordingMarks.length; i++) {
                                        this.fbRecordingMarks[i].position = i;
                                    }
                                });

                            } else {
                                // No marks found
                                this.noMarks = true;
                            }


                        });
                    } else {
                        //result.value.movementItem.length = 0;
                        this.noRecordingFound = true;
                        console.log("NO PIECES FOUND");
                    }

                } else {
                    this.noRecordingFound = true;
                    console.log("NO PIECES FOUND");
                }
            },
            "/user/" + BackendService.token + "/recording/" + this.routerParamId['recordingFileName'],
            {
                singleEvent: true,
                orderBy: {
                    type: firebase.QueryOrderByType.CHILD,
                    value: 'recordingDate' // mandatory when type is 'child'
                }
            }
        );
    }*/

    public firestoreStopListening(): void {
        if (this.listenerUnsubscribe === undefined) {
          console.log("Please start listening first.");
          return;
        }
    
        this.listenerUnsubscribeMarks();
        this.listenerUnsubscribeMarks = undefined;

        this.listenerUnsubscribe();        
        this.listenerUnsubscribe = undefined;
    }

    ngOnDestroy(){
        // STOP PLAYER IF IS AUDIO PLAYING
        if(this.player.isAudioPlaying()){
            console.log("DISPOSED THE AUDIO");
            this.player.dispose();
        }

        this.firestoreStopListening();

        application.android.off(AndroidApplication.activityBackPressedEvent);
        console.log("AudioAnalyzer - ngOnDestroy()");
    }

}