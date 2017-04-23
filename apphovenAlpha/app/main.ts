// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic, NativeScriptModule } from "nativescript-angular/platform";
import { AppModule } from "./app.module";
import firebase = require("nativescript-plugin-firebase");
import { BackendService } from "./shared";

firebase.init({
  onMessageReceivedCallback: function(message) {
      console.log(`Title: ${message.title}`);
      console.log(`Body: ${message.body}`);
      // if your server passed a custom property called 'foo', then do this:
      // console.log(`Value of 'foo': ${message.data.foo}`);
  },
   persist: true
          }).then(
              function (instance) {
                firebase.subscribeToTopic("allDevices");
                console.log("firebase.init done");
              },
              function (error) {
                console.log("firebase.init error: " + error);
              }
          );

platformNativeScriptDynamic().bootstrapModule(AppModule);