const SpelunkyWatcher = require("./watcher.js");

const itemConfig = [
    [ 4,0,"Climbing Gloves"],
    null,
    null,
    null,
    [ 4,1,"Parachute"],
    [ 9,0,"Compass"],
    [ 6,0,"Sprint Shoes"],
    [ 5,0,"Pitcher's Mitt"],
    [13,0,"Crysknife"],
    [ 8,0,"Sticky Paste"],
    [ 3,0,"Spectacles"],
    [ 7,0,"Spike Boots"],
    null,
    [13,1,"Hedjet"],
    [10,1,"Kapala"],
    null
];

const trapConfig = [
    [3,1], //Spikes
    [4,1], //Arrow trap
    [4,4], //Powder Box
    [0,2], //Boulder
    [1,2], //Tiki Trap
    [1,4], //Acid?
    [2,2], //Spring
    [3,2], //Mine
    [2,4], //Turret
    [0,3], //Force Field
    [1,3], //Crush Trap
    [2,3], //Ceiling Trap
    [3,3], //Spike Ball
]

function offset(width,height,cols,oX,oY,index){
    let x = index % cols;
    let y = Math.floor(index / cols);
    return [x*width+oX,y*height+oY];
}
const levelOffset   = offset.bind(null,332,190, 3,2,5);
const mobItemOffset = offset.bind(null,128,128,16,0,0);
const trapOffset = offset.bind(null,200,200,5,0,0);

//Web server & Web Sockets
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

//Web Sockets - track all webSockets and send current state to new sockets
const webSockets = [];
wss.on("connection",(ws)=>{
    webSockets.push(ws);
    sendState(ws)
    console.warn(`New connection`)
    ws.on("close",(code,reason)=>{
        console.warn(`Connection lost ${code} - ${reason}`);
        webSockets.splice(webSockets.indexOf(ws),1);
    })
});

//Express Js
app.use("/static",express.static(path.join(__dirname, "static")));

//Server
server.listen(8080,()=>{
    console.log(`Server started: http://${server.address().address}:${server.address().port}/static/overlay.html`);
})

function getKiller([killerKind,killerCode]){
    if (killerCode == 1215){
        return getKiller(["MONSTER",5])
    }

    switch (killerKind){
        case "MONSTER":
            return {
                name: watcher.config.ordering.monsters[killerCode],
                type: "MONSTER",
                image: mobItemOffset(killerCode)
            };
        case "OTHER":
            return {
                name: watcher.config.killers.otherValues[killerCode],
                type: "OTHER",
                image: null
            }
        case "TRAP":
            let [x,y]=trapConfig[killerCode];
            return {
                name: watcher.config.ordering.traps[killerCode],
                type: "TRAP",
                image: [x*128,y*128]
            }
            
    }
}

let curData = "null";

function handler({plays, wins, deaths, score, levelName, killerName:killerInfo, items, kills}){

    let mappedItems = items.map(i=>{
        let [x,y,name] = itemConfig[i];
        return {name,pos:[x,y]};
    });

    curData = JSON.stringify({
        plays, wins, deaths, score,
        level: {
            code: levelName.slice(0,2),
            image: levelOffset(levelName[2]),
            name: watcher.config.ordering.levelVariants[levelName[2]]
        },
        killer: getKiller(killerInfo),
        items: mappedItems
    });

    for(let ws of webSockets){
        sendState(ws);
    }
}

function sendState(ws){
    ws.send(curData);
}



const watcher = new SpelunkyWatcher("FileConfig.json","D:\\Steam\\steamapps\\common\\Spelunky\\Data\\spelunky_save.sav");
watcher.on("level",handler)
watcher.on("level",console.log)
watcher.startUp(true).then(console.log,console.error)