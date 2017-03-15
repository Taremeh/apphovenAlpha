require('globals'); // necessary to bootstrap tns modules on the new thread
var app = require('application');
var utils = require("utils/utils");
var soundNs = require("nativescript-sound");
var metronome = soundNs.create("~/pages/metronome/audio/click.mp3");

    onmessage = function(msg) {
        var request = msg.data;
        var tempo = request.tempo;

        var result = timeout(tempo);

        var msgb = result != undefined ? { success: true } : { success: false } 
        // var msg = result != undefined ? { success: true, src: result } : { }

        postMessage(msgb);
    }

    function timeout(tempo) {

        /*
        IN DEV: NOTIFICATION-SERVICE
        (?) => MAY BE DELETED IN NEXT COMMIT
        
        var context = utils.ad.getApplicationContext();
        var builder = new android.app.Notification.Builder(context);
        var manager = context.getSystemService(android.content.Context.NOTIFICATION_SERVICE);

        builder.setContentTitle("Apphoven Metronome")
            .setContentText("Tempo: "+tempo)
            .setAutoCancel(true)
            .setColor(android.R.color.holo_green_dark) // optional
            .setVibrate([300, 150, 300]) // optional
            .setLights(android.R.color.MAGENTA, 300, 500)
            .setSmallIcon(android.R.drawable.btn_star_big_on);

        manager.notify(1, builder.build());
        */
        var timestamp = (new Date()).getTime();
        function run() {

            var now = (new Date()).getTime();

            if( now - timestamp >= (60000/tempo) ) {
                console.log( 'tick' );
                // console.log(now-timestamp);
                metronome.play();
                timestamp = now;
            }
            // Set Repeat-Check-Rate. For example:
            // 3 => Check every 3ms if next tick shall be fired
            setTimeout(run, 3);
        }
        return run();
    }