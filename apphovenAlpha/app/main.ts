// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic } from "nativescript-angular/platform";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { AppModule } from "./app.module";
//import firebase = require("nativescript-plugin-firebase/app");
const firebase = require("nativescript-plugin-firebase/app");
import { BackendService } from "./shared";

firebase.initializeApp({
  onMessageReceivedCallback: function(message) {
      console.log(`Title: ${message.title}`);
      console.log(`Body: ${message.body}`);
      // if your server passed a custom property called 'foo', then do this:
      // console.log(`Value of 'foo': ${message.data.foo}`);
  },
  persist: true
});

platformNativeScriptDynamic().bootstrapModule(AppModule);