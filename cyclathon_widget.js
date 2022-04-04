let thonState = {
    subs: 0,
    bits: 0,
    dono: 0,
    cap: 0,
    running: 1,
    // distances
    total: 0,
    remaining: 0, // self updates, adjust the total
    covered: 0
}

loadState();

saveTimer = setInterval(function() { SE_API.store.set('cyclethonStats', thonState);},10000);

var commands = function(command, counter, value) {
    if (command === "add") {
        thonState[counter] += parseFloat(value);
    } else if (command === "del") {
        thonState[counter] -= parseFloat(value);
    } else if (command === "set") {
        thonState[counter] = parseFloat(value);
    } else if (command === "start") {
        if (document.getElementById('overall').classList.contains("fadeOutClass")) {
            document.getElementById('overall').classList.remove("fadeOutClass");
        }
        thonState.running = 1;
    } else if (command === "stop") {
        document.getElementById('overall').classList.add("fadeOutClass");
        thonState.running = 0;
    } else if (command === "reset") {
        document.getElementById('overall').classList.add("fadeOutClass");
        thonState = {
            subs: 0,
            bits: 0,
            dono: 0,
            cap: 0,
            running: 0,
            // distances
            total: 0,
            remaining: 0,
            covered: 0
        };
    }
    updateTotal();
};
//    "stats"  // a potential one.... if can send to chat

let distPerSub = 0,
    distPerBit = 0,
    distPerBuck = 0,
    distCap = 0,
    pullKey = '';

let userCurrency,
    totalEvents = 0;
var channel;
var oldsessionID;
var gps = { old: { latitude: 0.0, longitude: 0.0 }, new: { latitude: 0.0, longitude: 0.0 } };

var app, speedhider;

window.addEventListener('onEventReceived', function (obj) {
    if (!obj.detail.event) {
      return;
    }
    if (typeof obj.detail.event.itemId !== "undefined") {
        obj.detail.listener = "redemption-latest"
    }
    const listener = obj.detail.listener.split("-")[0];
    const event = obj.detail.event;
    if (thonState.running && listener === 'subscriber') {
        if (parseInt(event.tier) >= 3000) {
            thonState.total += distPerSub;
        }
        if (parseInt(event.tier) >= 2000) {
            thonState.total += distPerSub;
        }   
        thonState.total += distPerSub;
        thonState.subs++;
        updateTotal();
    } else if (thonState.running && listener === 'cheer') {
        thonState.total += distPerBit * event.amount;
        thonState.bits += event.amount;
        updateTotal();
    } else if (thonState.running && listener === 'tip') {
        thonState.total += distPerBuck * event.amount;
        thonState.dono += event.amount;
        updateTotal();
    } else if (listener === 'message') {
        let data = event.data;
        let message = data.text;

        let user = data.displayName.toLowerCase();
        let userstate = {
            "mod": parseInt(data.tags.mod),
            "badges": {
                "broadcaster": (user === channel)
            }
        };

        if (!userstate.mod && !userstate.badges.broadcaster) {
            return;
        }
        if (message.substring(0,6) !== "!cycle") {
            return;
        }
        // !cycle del covered 5
        const parts = message.split(' ');
        if (parts[2] && thonState.hasOwnProperty(parts[2])) {
            commands(parts[1], parts[2], parts[3]);
            updateTotal();
        } else {
            commands(parts[1]);
        }
        
    }
});

window.addEventListener('onWidgetLoad', function (obj) {
    channel = obj.detail.channel.username;

    userCurrency = obj.detail.currency;
    const fieldData = obj.detail.fieldData;
    eventsLimit = fieldData.eventsLimit;
    distPerSub = fieldData.kmSubDist / fieldData.kmSubAmount;
    distPerBit = fieldData.kmBitDist / fieldData.kmBitAmount;
    distPerBuck = fieldData.kmBuckDist / fieldData.kmBuckAmount;
    pullKey = fieldData.rtirlPullKey;

    firebase.database.INTERNAL.forceWebSockets();
    app = firebase.initializeApp( {
        apiKey: "AIzaSyC4L8ICZbJDufxe8bimRdB5cAulPCaYVQQ",
        databaseURL: "https://rtirl-a1d7f-default-rtdb.firebaseio.com",
        projectId: "rtirl-a1d7f",
        appId: "1:684852107701:web:d77a8ed0ee5095279a61fc",
    },
    "rtirl-api");


    addListener("speed", function (speed) {
        document.getElementById("speed").innerText = (speed * 3.6).toFixed(2);
    });
    addListener("heading", function (heading) {
        document.getElementById("heading").innerText = heading.toFixed(2);
    });

    addListener("sessionId", function (sessionId) {
        if (sessionId != oldsessionID) {
            oldsessionID = sessionId;
            // Set starting point to the current point
            gps.old.latitude  = gps.new.latitude;
            gps.old.longitude = gps.new.longitude;
        }
    });

    addListener("location", function (location) {
        gps.new.latitude = location.latitude;
        gps.new.longitude = location.longitude;

        if (document.getElementById('speedBox').classList.contains("fadeOutClass")) {
            document.getElementById('speedBox').classList.remove("fadeOutClass");
            document.getElementById('headingBox').classList.remove("fadeOutClass");
        }
        clearTimeout(speedhider);
        speedhider = setTimeout(function() { document.getElementById('speedBox').classList.add("fadeOutClass");
            document.getElementById('headingBox').classList.add("fadeOutClass")},30000);

        if (oldsessionID === undefined && gps.old.latitude == 0) {
            gps.old.latitude = location.latitude;
            gps.old.longitude = location.longitude;
        }

        // We have new gps points. Let's calculate the delta distance using previously saved gps points.
        delta = distanceInKmBetweenEarthCoordinates(gps.new.latitude, gps.new.longitude, gps.old.latitude, gps.old.longitude);
        thonState.covered = thonState.covered + delta;
        updateTotal();
      
        //shifting new points to old for next update
        gps.old.latitude = location.latitude;
        gps.old.longitude = location.longitude;
    });
});

function updateTotal() {
    if (thonState.cap > 0) {
        thonState.remaining = (thonState.total < thonState.cap ? 
                        thonState.total : thonState.cap) - thonState.covered;
    } else {
        thonState.remaining = thonState.total - thonState.covered;
    }

    document.getElementById("totalDist").innerText = thonState.covered.toFixed(2);
}

function loadState() {
    SE_API.store.get('cyclethonStats').then(obj => {
        if (obj !== null && typeof obj !== "undefined") {
            thonState = obj;
            updateTotal();
        }
    });

}

function addListener(type, callback) {
  return app
    .database()
    .ref()
    .child("pullables")
    .child(pullKey)
    .child(type)
    .on("value", function (snapshot) {
      callback(snapshot.val());
  });
}

//rtirl distance functions
function degreesToRadians(degrees) {
   return degrees * Math.PI / 180;
}

function distanceInKmBetweenEarthCoordinates(lat1, lon1, lat2, lon2) {
   var earthRadiusKm = 6371;

   var dLat = degreesToRadians(lat2 - lat1);
   var dLon = degreesToRadians(lon2 - lon1);

   lat1 = degreesToRadians(lat1);
   lat2 = degreesToRadians(lat2);

   var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
   var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   return earthRadiusKm * c;
}
