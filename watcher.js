/** @typedef {{
 *      offsets:{
 *          monsterKills:number,
 *          monsterDeaths:number,
 *          trapDeaths:number
 *      },
 *      ordering:{
 *          monsters:string[],
 *          traps: string[],
 *          items: string[],
 *          levelVariants: string[],
 *          worldNames: string[],
 *      },
 *      killers:{
 *          firstMonster:number,
 *          firstTrap:number,
 *          otherValues:{[x:string]:string}
 *      }
 * }} config */

 /** @typedef {{
  *     plays:number,
  *     wins:number,
  *     deaths:number,
  *     score:number,
  *     levelName:[number,number,number],
  *     killerName:["MONSTER"|"TRAP"|"OTHER",number],
  *     items:number[],
  *     kills: [number,number][]
  * }} levelEvent
  */

const fs = require("fs");
const events = require("events");

class SpelunkyWatcher extends events.EventEmitter {
    constructor (configLocation,gameLocation){
        super();
        this.configLocation = configLocation;
        this.gameLocation = gameLocation;

        /** @type {config} */
        this.config;
        this.monsterKills = Array(56).fill(0);
        this.curPlays = 0;

        this.starting = undefined;
    }

    async startUp(fireFirst=false){
        if (this.starting){
            return this.starting;
        }
        this.starting = (async ()=>{
            await this.updateFromConfig();
            if (fireFirst){
                this.handler();
            }
        })();
        return this.starting;
    }

    async updateFromConfig(){
        const rawConfig = await fs.promises.readFile("FileConfig.json");
        this.config = JSON.parse(rawConfig);
        fs.watch(this.gameLocation,()=>setTimeout(()=>this.handler(),1000));
    }

    async handler() {
        let buffer;
        try {
            buffer = await fs.promises.readFile(this.gameLocation);
        } catch (e){
            console.error(e);
            return;
        }
        const data = new Int32Array(buffer.buffer,buffer.byteOffset,buffer.byteLength / Uint32Array.BYTES_PER_ELEMENT)
    
        const [
            plays,deaths,wins,c0_1,
            c16,c1_1,c1_2,BestScore,
            BestTime,AvgScore,LastLevel,LevelVariant,
            score,KilledBy,flg1,flg2,
            flg3,flg4,c1_3,c0_4
        ] = data.subarray(0,20);
    
        if (plays == this.curPlays){
            return
        }
        this.curPlays = plays;
    
        //Raw Data for debugging
        console.log({
            plays,deaths,wins,BestScore,
            BestTime,AvgScore,LastLevel,LevelVariant,
            LastScore: score,KilledBy,
            flg1: fFlag(flg1),
            flg2: fFlag(flg2),
            flg3: fFlag(flg3),
            flg4: fFlag(flg4)
        })
    
        const not0 = [c0_1,c0_4];
        if (not0.some(x=>x != 0)) console.log("0s",not0)
        
        const not1 = [c1_1,c1_2,c1_3];
        if (not1.some(x=>x != 1)) console.log("1s",not1)
        
        if (c16 != 16) console.log("c16",c16);
        
        const items = extractItemIds(flg1,flg2,flg3,flg4);
    
        const levelName = this.findLevelName(LastLevel,LevelVariant);
        const killerName = this.findKiller(KilledBy);
        const curMonsterKills  = data.subarray(this.config.offsets.monsterKill, this.config.offsets.monsterKill + this.config.ordering.monsters.length)
        const diffMonsterKills =  findDiffIds(this.monsterKills, curMonsterKills);
        this.monsterKills = Array.from(curMonsterKills)

        this.emit("level",{
            plays, wins, deaths,
            score, levelName,
            killerName,
            items,
            kills: diffMonsterKills
        });
    }

    findLevelName(levelNumber,levelVariant){
        levelNumber -= 1
        const world = Math.floor(levelNumber/4)+1
        const level = (levelNumber%4)+1
        let name;
        if (levelVariant == 0){
            name = world-1
        } else {
            name = levelVariant+4;
        }
        return [world,level,name];
    }

    findKiller(id){
        if (id in this.config.killers.otherValues){
            return ["OTHER",id]
        }
    
        if (this.config.killers.firstMonster <= id &&
            id < this.config.killers.firstMonster + this.config.ordering.monsters.length
        ){
            return ["MONSTER",id-this.config.killers.firstMonster];
        }
    
        if (this.config.killers.firstTrap <= id &&
            id < this.config.killers.firstTrap + this.config.ordering.traps.length
        ){
            return ["TRAP",id-this.config.killers.firstTrap];
        }
    }
}

/**
 * @method
 * @name SpelunkyWatcher#on
 * @param {"level"} event
 * @param {LevelEvent} args
 * @returns {void}
 */

function fFlag(n){
    const c = (n >>> 0).toString(16).padStart(8,"0").toUpperCase();
    return c.substr(0,2)+"-"+c.substr(2,2)+"-"+c.substr(4,2)+"-"+c.substr(6,2);
}

function extractItemIds(...flags){
    return [].concat(...flags.map((flag,n)=>
        [0xFF000000,0xFF0000,0xFF00,0xFF]
            .map((a,b)=>[a,b+n*4])
            .filter(x=>flag&x[0])
            .map(x=>x[1])
    ))
}

function findDiffIds(oldArray,newArray){
    return oldArray
        .map((k,i)=>[i,newArray[i]-k])
        .filter(x=>x[1] > 0)
}

module.exports = SpelunkyWatcher;