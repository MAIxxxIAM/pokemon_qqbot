import { $, Context, Session } from "koishi";
import {} from "./type";

export function initType<O extends new (...args: any[]) => any>(
  data: any,
  type: O,
  args?: any
) {
  console.dir(data.statusEffects, { depth: null });
  const restorData = Object.assign(new type(args), data);
  restorData.restor();
  console.dir(restorData.statusEffects, { depth: null });
  return restorData;
}
