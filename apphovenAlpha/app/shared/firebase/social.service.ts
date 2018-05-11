import { Injectable } from "@angular/core";
import { User } from "./user.model";
import { BackendService } from "./backend.service";

import firestore = require("nativescript-plugin-firebase");
const firebase = require("nativescript-plugin-firebase/app");

// import { firestore } from "nativescript-plugin-firebase";

@Injectable()
export class SocialService {
    addFriend(input){
        let inputType;
        if(input.includes("@")){
            inputType = "userEmail";
        } else {
            inputType = "userUrl";
        }
        const userCollection = firebase.firestore()
            .collection("user");

        const query = userCollection
            .where(inputType, "==", input)
            .limit(1);

        return query.get()
            .then(querySnapshot => {
            // {"docSnapshots":[{"id":"1SsdDFG3FajCC31123","exists":true}]}
            if(querySnapshot.docSnapshots[0].id) {
                // Block Users trying to add themselves as friends
                if(querySnapshot.docSnapshots[0].id == BackendService.token){
                    throw "friend-id equals user-id";
                }
                
                // Friend-Entity in User's Friend-List
                let userFriendListDoc = userCollection
                    .doc(BackendService.token)
                    .collection("friend")
                    .doc(querySnapshot.docSnapshots[0].id);
                
                // News-Inbox from Friend
                let friendNewsCollection = userCollection
                        .doc(querySnapshot.docSnapshots[0].id)
                        .collection("news");

                
                // Spam Prevention, if friend already received a request, block spam duplicates.
                let newsQuery = friendNewsCollection
                    .where("senderId", "==", BackendService.token)
                    .get()
                    .then(newsQuerySnapshot => {
                        if(querySnapshot.docSnapshots[0].id){
                            throw "friend request already sent";
                        }
                    });

                return userFriendListDoc.get().then(doc => {
                    if (doc.exists) {
                        throw "friend already added";
                    } else {
                        return userCollection
                        .doc(querySnapshot.docSnapshots[0].id)
                        .get().then(doc => {
                            // Everything from Friend
                            // return doc.data();

                            let returnContent = doc.data().userEmail;
                            if(doc.data().userName) {
                                returnContent = doc.data().userName;
                            }
                            // Add Friend to friend Collection
                            return userFriendListDoc.set({
                                friendName: returnContent,
                                confirmed: false
                            }).then(() => {
                                let date = Date.now();

                                // If userName != "" set friendRequestName, else friendRequestName = userEmail;
                                let friendRequestName = BackendService.email;
                                if(BackendService.userName != ""){
                                    friendRequestName = BackendService.userName;
                                }

                                // Send Friend-Request to Friend
                                return userCollection
                                    .doc(querySnapshot.docSnapshots[0].id)
                                    .collection("news")
                                    .doc(BackendService.token)
                                    .set({
                                        type: "friendrequest",
                                        senderId: BackendService.token,
                                        friendRequestName: friendRequestName,
                                        friendRequestEmail: BackendService.email,
                                        date: date
                                    }).then(() => {
                                        return returnContent;
                                    });
                            });
                        });
                    }
                });
            } else {
                // Throw not working
                throw "friend not found";
            }
            // return querySnapshot.docSnapshots[0].id;
        });
    }

    acceptFriend(friendId, friendName){
        let date = Date.now();

        // Friend-Request
        const userNewsDoc = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("news")
            .doc(friendId);
        
        // Friend-Entity in User's Friend List
        const userFriendDoc = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("friend")
            .doc(friendId);
        
        // User's Entity in Friend's Friend-List
        const friendUserDoc = firebase.firestore()
            .collection("user")
            .doc(friendId)
            .collection("friend")
            .doc(BackendService.token);

        // Delete Friend-Request
        return userNewsDoc.delete().then(() => {
            // Add Friend to User's Friend-List
            return userFriendDoc.set({
                confirmed: true,
                friendName: friendName,
                friendsSince: date,
                date: date
            }).then(() => {
                // Confirm User in Friend's Friend-List
                return friendUserDoc.update({
                    confirmed: true,
                    friendsSince: date,
                    date: date
                })
            });
        });
    }

    denyFriend(friendId){
        // Friend-Request
        const userNewsDoc = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("news")
            .doc(friendId);
        
        return userNewsDoc.delete();
    }

    removeFriend(friendId){
        // Friend-Request
        const friendNewsDoc = firebase.firestore()
            .collection("user")
            .doc(friendId)
            .collection("news")
            .doc(BackendService.token);

        // Friend-Entity in User's Friend List
        const userFriendDoc = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("friend")
            .doc(friendId);

        // User's Entity in Friend's Friend-List
        const friendUserDoc = firebase.firestore()
            .collection("user")
            .doc(friendId)
            .collection("friend")
            .doc(BackendService.token);
        
        // Delete Friend-Request
        return friendNewsDoc.get().then((friendRequest) => {
            if(friendRequest.exists){
                // 1-Way Friendship
                // Only delete Friend-Request and User's Friend-Entity:
                // Delete Friend-Request
                return friendNewsDoc.delete().then(() => {
                    // Delete User's Friend-Entity
                    return userFriendDoc.delete();
                });
            } else {
                // Two-Way Friendship OR Denied Friend-Request
                // Because Friend-Request does not exist in Friend's News-Inbox
                
                return friendUserDoc.get().then((twoWayFriendship) => {
                    if(twoWayFriendship.exists){
                        // Deny Two-Way-Friendship by revoking consent
                        return userFriendDoc.delete().then(() => {
                            return friendUserDoc.update({
                                confirmed: false
                            })
                        });
                    } else {
                        // Delete Friend-Entity in User's Friendlist
                        return userFriendDoc.delete();
                    }
                });
            }
        });
    }
}