
import exptolv from '../assets/json/ExpToLv.json'
import expbase from '../assets/json/expbase.json'
import skillMachines from '../assets/json/skillMachine.json'
import Base from '../assets/json/PokemonBase.json'
import  Type from '../assets/json/pokemonType.json'
import  bType from '../assets/json/battleType.json'
import  nature from '../assets/json/natures.json'
import { Skills } from '../battle'
import { Natures } from '../model'
import Fishing from '../assets/json/fishing.json'
import { FishItem} from '../fishing/type'


export const expToLv= exptolv
export const expBase = expbase
export const skillMachine = skillMachines
export const pokemonBase = Base
export const type = Type
export const battleType = bType

export const skills=new Skills(skillMachines.skill)
export const natures:Natures[] = nature
export const fishing:FishItem[] =Fishing