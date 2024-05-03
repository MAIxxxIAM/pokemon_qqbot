import { unknowns } from "../type/type";

export function getUknowns():unknowns{
  const letters=`abcdefghijklmnopqrstuvwxyz!?`
  const get=letters[Math.floor(Math.random()*letters.length)]
  return{
    id:get,
    name:'未知图腾'+get
  }
}
