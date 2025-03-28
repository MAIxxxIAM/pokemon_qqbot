import { $, Context, Session } from "koishi";
import {} from "./type";

export function initType<O extends new (...args: any[]) => any>(
  data: any,
  type: O,
  newData: any
) {
  const restorData = Object.assign(new type(newData), data);
  restorData.restor();
  return restorData;
}
