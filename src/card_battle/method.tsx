import { $, Context, Session } from "koishi";
import {} from "./type";

export function initType<O extends new (...args: any[]) => any>(
  data: any,
  type: O,
  newData: any
) {
  return Object.assign(new type(newData), data);
}
