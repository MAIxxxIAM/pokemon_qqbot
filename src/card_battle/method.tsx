import { $, Context, Session } from "koishi";
import {} from "./type";

export function initType<O extends new (...args: any[]) => any>(
  data: any,
  type: O,
  args?: any
) {
  const restorData = Object.assign(new type(args), data);
  restorData.restor();
  return restorData;
}
