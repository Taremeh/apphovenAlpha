import { Injectable, Inject } from "@angular/core";
import { BackendService } from "./backend.service";

// Deprecated Import
import firebase = require("nativescript-plugin-firebase");

// New Firebase Firestore Import
const firebasef = require("nativescript-plugin-firebase/app");

import { Observable } from "rxjs/Rx";

@Injectable()
export class PieceService {

    recordedPiece(pieceId: number, movementId: number, practicedTime: number, progressMade: number) {

    }


    addPiece(pieceId: any, composerId: number, composerName: string, pieceData: any, movementArray: any, pieceMovementArray: any): Promise<Response>{
        let i;
        let sP = pieceData;
        let piecePracticeArray;
        let piecePracticeMovements: any[];
        let piecePracticeMovementsAmount: number = 0;
        let dateToday = new Date().getTime();

        // If piece created by used, add prefix "u"
        if(sP.user_piece){
            pieceId = "u" + pieceId;
        }

        // Needed for BackendService: lastMovementId
        let firstMovementAdded = false
        let movementId = -2;


        if(movementArray != null) {
            // MOVEMENTS EXIST
            for(i = 0; i < pieceMovementArray.length; i++){
                // Define Movement Id
                pieceMovementArray[i].id = i;

                // Defines lastMovementId for BackendService. If multiple movements selected, register first one
                if(!firstMovementAdded && pieceMovementArray[i].state){
                    movementId = i;
                    firstMovementAdded = true;
                }
                if(pieceMovementArray[i].state){
                    // IF BEING PRACTICED
                    pieceMovementArray[i].lastUsed = dateToday;
                    pieceMovementArray[i].added = dateToday;
                    piecePracticeMovementsAmount += i;
                }
            }
            
            piecePracticeArray = { pieceId: pieceId, composerId: composerId, 
                composer: composerName,
                pieceTitle: sP.piece_title, 
                pieceWorkNumber: sP.piece_work_number, 
                movementItem: pieceMovementArray, 
                movementItemAmount: piecePracticeMovementsAmount,
                dateLastUsed: dateToday,
                dateAdded: dateToday,
                archived: false
            };

            console.log(piecePracticeArray.pieceTitle, piecePracticeArray.pieceWorkNumber);
        } else {
            // MOVEMENTS DO NOT EXIST
            piecePracticeArray = { pieceId: pieceId, composerId: composerId, 
                composer: composerName,
                pieceTitle: sP.piece_title, 
                pieceWorkNumber: sP.piece_work_number, 
                movementItemAmount: piecePracticeMovementsAmount,
                dateLastUsed: dateToday,
                dateAdded: dateToday,
                archived: false
            };
            console.log(piecePracticeArray.pieceTitle, piecePracticeArray.pieceWorkNumber);
        }

        let that = this;

        let pieceCollection = firebasef.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("piece");
        console.log("BACKEND ID: " + BackendService.token);
        return pieceCollection.doc(pieceId).set(piecePracticeArray);
        /* 
        Depracated Method Firebase
        
        return firebase.setValue(
            '/user/'+BackendService.token+'/piece/'+pieceId,
            piecePracticeArray
        );*/
    }

    removePiece(pieceId) {
        let pieceDocument = firebasef.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("piece")
            .doc(String(pieceId));

        return pieceDocument.delete().then(() => {
             console.log("Piece with ID ->" + pieceId + "<- has been deleted.");
        });        
    }

    updateMovement(pieceId: number, movementPackage){
        let dateToday = new Date().getTime();
        let pieceDocument = firebasef.firestore()
        .collection("user")
        .doc(BackendService.token)
        .collection("piece")
        .doc(String(pieceId));

        pieceDocument.update({
            dateLastUsed: dateToday,
            movementItem: movementPackage
        }).then(() => {
            console.log("Movements of piece -> " + pieceId + " <- updated.");
          });
    }

    archivePiece(pieceId, type: number) {
        let pieceDocument = firebasef.firestore()
        .collection("user")
        .doc(BackendService.token)
        .collection("piece")
        .doc(String(pieceId));

        let dateToday = new Date().getTime();

        if(type == 0){
            // Add Piece To Archive
            return pieceDocument.update({
                archived: true,
                archivedDate: dateToday 
            }) 
        } else if (type == 1) {
            // Add Piece To Practice List
            return pieceDocument.update({
                archived: false,
                archivedDate: null
            }) 
        } else {
            return false;
        }
    }

    removeSession(sessionId: number) {
        let pieceDocument = firebasef.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("practice-session")
            .doc(String(sessionId));

        return pieceDocument.delete().then(() => {
            console.log("Session with ID ->" + sessionId + "<- has been deleted.");
        });       
    }

    /* Piece Forum (Social) */
    submitPost(userId, pieceId, postType, message, movementId?) {
        let date = Date.now();
        let pieceForumCollection = firebasef.firestore()
            .collection("piece")
            .doc(pieceId)
            .collection("forum");
        
        return pieceForumCollection.add({
            date: date,
            dateSubmitted: date,
            userId: userId,
            userName: BackendService.userName,
            pieceId: pieceId,
            type: postType,
            message: message,
            movementId: movementId,
            solved: false
        });
    }

    answerPost(pieceId, postId, answer) {
        let date = Date.now();

        let pieceForumQuestionDoc = firebasef.firestore()
            .collection("piece")
            .doc(pieceId)
            .collection("forum")
            .doc(postId);

        /* MAINTENANCE! 
         * This can be simplified to one if loop!
         */

        return pieceForumQuestionDoc.get().then(doc => {
            if (doc.exists) {
                console.log(`Document data: ${JSON.stringify(doc.data())}`);
                /*if(doc.data().answerArray != undefined || doc.data().answerArray != "") {
                    // Answers to this question already exist
                    let newAnswerArray: Array<any> = doc.data().answerArray;
                    newAnswerArray.push({
                        id: newAnswerArray.length-1,
                        userId: BackendService.token,
                        answer: answer
                    });
                    // Save answer
                    return pieceForumQuestionDoc.update({
                        date: date,
                        answer: newAnswerArray
                    });
                } else {*/
                    // No answer to this question yet
                    let date = Date.now();
                    let newAnswerArray = [];

                    if(doc.data().answerArray){
                        newAnswerArray = doc.data().answerArray;
                    }
                    newAnswerArray.push({
                        date: date,
                        id: newAnswerArray.length,
                        userId: BackendService.token,
                        userName: BackendService.userName,
                        answer: answer
                    });

                    // Save first answer
                    return pieceForumQuestionDoc.update({
                        date: date,
                        answerArray: newAnswerArray
                    });
                //}
            } else {
                console.log("No such document!");
                throw "question not found";
            }
        });        
    }

    removeQuestion(pieceId, postId) {
        let pieceForumQuestionDoc = firebasef.firestore()
            .collection("piece")
            .doc(pieceId)
            .collection("forum")
            .doc(postId);
        
        return pieceForumQuestionDoc.delete();

    }

    reportQuestion(pieceId, postId) {
        let pieceForumQuestionDoc = firebasef.firestore()
            .collection("piece")
            .doc(pieceId)
            .collection("forum")
            .doc(postId);
        
        return pieceForumQuestionDoc.get().then(doc => {
            if (doc.exists) {
                let reportCounter = 1;

                // Check if question has already been reported
                // If true => set as ground value
                if(doc.data().reportCounter){
                    reportCounter = doc.data().reportCounter + 1;
                }

                return pieceForumQuestionDoc.update({
                    reportCounter: reportCounter
                }).then(() => {
                    // Report to Dev
                    let date = Date.now();
                    let supportReportDoc = firebasef.firestore()
                        .collection("support")
                        .doc(BackendService.token)
                        .collection("report")
                        .doc(pieceId);

                    return supportReportDoc.set({
                        pieceId: pieceId,
                        postId: postId,
                        date: date,
                        type: "question"
                    });
                })
            }
        });
    }

    removeAnswer(pieceId, postId, answerId) {
        let pieceForumQuestionDoc = firebasef.firestore()
            .collection("piece")
            .doc(pieceId)
            .collection("forum")
            .doc(postId);
        
        return pieceForumQuestionDoc.get().then(doc => {
            if (doc.exists) {
                let answerArray = [];
                answerArray = doc.data().answerArray;

                answerArray.splice(answerId, 1);

                // Update Answer-Array-Index (IDs)
                for(let i=0;i<answerArray.length;i++) {
                    answerArray[i].id = i;
                }
                
                return pieceForumQuestionDoc.update({
                    answerArray: answerArray
                })
            }
        });
    }

    reportAnswer(pieceId, postId, answerId) {
        let pieceForumQuestionDoc = firebasef.firestore()
            .collection("piece")
            .doc(pieceId)
            .collection("forum")
            .doc(postId);
        
        return pieceForumQuestionDoc.get().then(doc => {
            if (doc.exists) {
                let answerArray = [];
                answerArray = doc.data().answerArray;
                if(answerArray[answerId].reported) {
                    answerArray[answerId].reported = answerArray[answerId].reported + 1;
                } else {
                    answerArray[answerId].reported = 1;
                }

                return pieceForumQuestionDoc.update({
                    answerArray: answerArray
                }).then(() => {
                    // Report to Dev
                    let date = Date.now();
                    let supportReportDoc = firebasef.firestore()
                        .collection("support")
                        .doc(BackendService.token)
                        .collection("report")
                        .doc(pieceId);

                    return supportReportDoc.set({
                        pieceId: pieceId,
                        postId: postId,
                        date: date,
                        type: "answer",
                        answerId: answerId
                    });
                });
            }
        });
    }

    acceptAnswer(pieceId, postId, answerId) {
        let pieceForumQuestionDoc = firebasef.firestore()
            .collection("piece")
            .doc(pieceId)
            .collection("forum")
            .doc(postId);

        return pieceForumQuestionDoc.get().then(doc => {
            if (doc.exists) {
                let answerArray = [];
                answerArray = doc.data().answerArray;
                answerArray[answerId].accepted = true;

                // Extract solving answer
                let answer = answerArray[answerId];
                // Delete answer
                answerArray.splice(answerId, 1);
                // Unshift solving answer to i=0 of array
                answerArray.unshift(answer);
    
                return pieceForumQuestionDoc.update({
                    solved: true,
                    answerArray: answerArray
                });
            }
        });
    }
}