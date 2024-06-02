import { Context } from 'koishi';
import {PlantTree,BerryTree,Event,Farm} from './berryTreeFarm'

export async function apply(ctx:Context){
    ctx.command('宝可梦').subcommand('test').action(async ({session})=>{
        const testUser:Farm={
            sends:[],
            trees:[]
        }
    })
}