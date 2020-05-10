const SpelunkyWatcher = require("./watcher.js");

async function main(){
    const watcher = new SpelunkyWatcher("FileConfig.json","D:\\Steam\\steamapps\\common\\Spelunky\\Data\\spelunky_save.sav")
    charHandlers = {
        "c":["reloading config",()=>watcher.updateFromConfig()]
    }

    watcher.on("level",({plays, wins, deaths, score, levelName, killerName, items, kills})=>{
        console.log();
        console.log(` === Last Run (#${plays}) === `)
        console.log(`      Score: ${score}`)
        console.log(`    Reached: ${levelName[0]}-${levelName[1]} (${levelName[2]})`)
        console.log(`  Killed by: ${killerName}`)
        if(items.length){
            console.log("      Items:",items.join(", "));
        }
        if(kills.length > 0){
            console.log("      Kills:")
            for(let [k,v] of kills){
                console.log(k.toString().padStart(20),v);
            }
            console.log()
        }
    });

    await watcher.startUp(true);

    process.stdin.on("data",async data=>{
        var char = data.toString('utf8')[0];
        var opts = charHandlers[char];
        if (!opts) return

        console.log(opts[0]);
        opts[1]();
    })
}

main().then(console.log,console.error);