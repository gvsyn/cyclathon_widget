let thonState = {
    subs: 0,
    bits: 0,
    dono: 0,
    cap: 0,
    running: 0,
    // distances
    total: 0,
    remaining: 0, // self updates, adjust the total
    covered: 0
}

loadState();

let loadTimer = setInterval(function() { loadState(); updateTotal(); },10000);

let pullKey = '';

let userCurrency,
    totalEvents = 0;
var channel;
var oldsessionID;
var gps = { old: { latitude: 0.0, longitude: 0.0 }, new: { latitude: 0.0, longitude: 0.0 } };

var app, speedhider;


function updateTotal() {
    if (thonState.cap > 0) {
        thonState.remaining = (thonState.total < thonState.cap ? 
                        thonState.total : thonState.cap) - thonState.covered;
    } else {
        thonState.remaining = thonState.total - thonState.covered;
    }

    document.getElementById("remainingDist").innerText = thonState.remaining.toFixed(2);
    document.getElementById("totalDist").innerText = thonState.covered.toFixed(2);
}

function loadState() {
    SE_API.store.get('cyclethonStats').then(obj => {
        if (obj !== null && typeof obj !== "undefined") {
            thonState = obj;
        }
    });

}
