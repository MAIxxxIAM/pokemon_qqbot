import { $, Context, h, noop, Schema } from 'koishi'
import fs from "fs";
import path, { resolve } from "path";
import { load } from "cheerio";
import { } from 'koishi-plugin-puppeteer'
import imageSize from 'image-size'
import { Buffer } from 'buffer'
import {
  Ot as compareStrokes,
} from './assets/宝可影/main.js';
import { getUknowns } from './utils/motheds';
import { config, legendaryPokemonId, Pokebattle } from '../../index';
import crypto from 'crypto'
import { isResourceLimit, sendMarkdown, toUrl } from '../../utils/method';
import { PrivateResource } from '../../model';
import { Pokedex } from '../../pokedex/pokedex';
import pokemonCal from '../../utils/pokemon';

export const name = 'handle-and-ciying'
export const inject = {
  required: ['database', 'puppeteer'],
}

// pz*

// smb*
declare module 'koishi' {
  interface Tables {
    p_wordle_game_records: GameRecord
    p_extra_wordle_game_records: ExtraGameRecord
    p_wordle_gaming_player_records: GamingPlayer
    p_wordle_player_records: PlayerRecord
  }
}

// jk*
export interface GameRecord {
  id: number
  channelId: string
  isStarted: boolean
  gameMode: string
  wordGuessHtmlCache: string
  strokesHtmlCache: string[][]
  remainingGuessesCount: number
  wordAnswerChineseDefinition: string
  guessWordLength: number
  wordGuess: string
  isRunning: boolean
  isHardMode: boolean
  isUltraHardMode: boolean
  correctLetters: string[]
  presentLetters: string
  presentLettersWithIndex: string[]
  absentLetters: string
  correctPinyinsWithIndex: string[]
  presentPinyins: string[]
  presentTones: string[]
  presentPinyinsWithIndex: string[]
  absentPinyins: string[]
  correctTonesWithIndex: string[]
  presentTonesWithIndex: string[]
  absentTones: string[]
  timestamp: string
  remainingWordsList: string[]
  isAbsurd: boolean
  isChallengeMode: boolean
  targetWord: string
  wordlesNum: number
  wordleIndex: number
  isWin: boolean
  pinyin: string
  isFreeMode: boolean
  previousGuess: string[]
  previousGuessIdioms: string[]
}

export interface ExtraGameRecord {
  id: number
  channelId: string
  gameMode: string
  wordGuessHtmlCache: string
  strokesHtmlCache: string[][]
  wordAnswerChineseDefinition: string
  guessWordLength: number
  wordGuess: string
  correctLetters: string[]
  presentLetters: string
  presentLettersWithIndex: string[]
  absentLetters: string
  correctPinyinsWithIndex: string[]
  presentPinyinsWithIndex: string[]
  absentPinyins: string[]
  presentPinyins: string[]
  presentTones: string[]
  correctTonesWithIndex: string[]
  presentTonesWithIndex: string[]
  absentTones: string[]
  timestamp: string
  wordlesNum: number
  wordleIndex: number
  isWin: boolean
  remainingGuessesCount: number
  pinyin: string
  previousGuess: string[]
  previousGuessIdioms: string[]
}

export interface GamingPlayer {
  id: number
  channelId: string
  userId: string
  username: string
  money: number
}

export interface PlayerRecord {
  id: number
  userId: string
  username: string
  win: number
  lose: number
  moneyChange: number
  wordGuessCount: number
  stats: PlayerStats;
  fastestGuessTime: Record<string, number>;
  extraCiyingRankInfo: ExtraCiyingRankInfo;
}

interface PlayerStats {
  '宝可兜'?: WinLoseStats;
  '宝可影'?: WinLoseStats;
}

interface WinLoseStats {
  win: number;
  lose: number;
}

interface ExtraCiyingRankInfo {
  successCountIn1HardMode: number
  successCountIn1Mode: number
  successCountIn2Mode: number
  successCountIn3Mode: number
  successCountIn4Mode: number

  winIn1HardMode: number;
  winIn1Mode: number;
  winIn2Mode: number;
  winIn3Mode: number;
  winIn4Mode: number;

  loseIn1HardMode: number;
  loseIn1Mode: number;
  loseIn2Mode: number;
  loseIn3Mode: number;
  loseIn4Mode: number;

  fastestGuessTimeIn1HardMode: number;
  fastestGuessTimeIn1Mode: number;
  fastestGuessTimeIn2Mode: number;
  fastestGuessTimeIn3Mode: number;
  fastestGuessTimeIn4Mode: number;
}

const initialExtraCiyingRankInfo: ExtraCiyingRankInfo = {
  "successCountIn1HardMode": 0,
  "successCountIn1Mode": 0,
  "successCountIn2Mode": 0,
  "successCountIn3Mode": 0,
  "successCountIn4Mode": 0,
  "winIn1HardMode": 0,
  "winIn1Mode": 0,
  "winIn2Mode": 0,
  "winIn3Mode": 0,
  "winIn4Mode": 0,
  "loseIn1HardMode": 0,
  "loseIn1Mode": 0,
  "loseIn2Mode": 0,
  "loseIn3Mode": 0,
  "loseIn4Mode": 0,
  "fastestGuessTimeIn1HardMode": 0,
  "fastestGuessTimeIn1Mode": 0,
  "fastestGuessTimeIn2Mode": 0,
  "fastestGuessTimeIn3Mode": 0,
  "fastestGuessTimeIn4Mode": 0
}

const initialStats: PlayerStats = {
  '宝可兜': { win: 0, lose: 0 },
  '宝可影': { win: 0, lose: 0 },
};

const initialFastestGuessTime: Record<string, number> = {
  '宝可兜': 0,
  '宝可影': 0,
};

interface PinyinItem2 {
  term: string;
  pinyin: string;
}

// zhs*
export async function apply(ctx: Context) {
  // cl*
  const modes = {
    '困难': 'hard',
    '超困难': 'ultraHardMode',
  };
  const wordlesMap = {
    'x1': 1,
    'x2': 2,
    'x3': 3,
    'x4': 4
  };
  const exams = [
    "宝可兜", '宝可影',
  ];
  const isQQOfficialRobotMarkdownTemplateEnabled = config.isEnableQQOfficialRobotMarkdownTemplate && config.key !== '' && config.customTemplateId !== ''
  // 谜底 需要在 ./assets/宝可兜/idioms.json 文件中为其设置 拼音和含义
  const commonIdiomsList = ["妙蛙种子", "妙蛙草", "妙蛙花", "小火龙", "火恐龙", "喷火龙", "杰尼龟", "卡咪龟", "水箭龟", "绿毛虫", "铁甲蛹", "巴大蝶", "独角虫", "铁壳蛹", "大针蜂", "波波", "比比鸟", "大比鸟", "小拉达", "拉达", "烈雀", "大嘴雀", "阿柏蛇", "阿柏怪", "皮卡丘", "雷丘", "穿山鼠", "穿山王", "尼多兰", "尼多娜", "尼多后", "尼多朗", "尼多力诺", "尼多王", "皮皮", "皮可西", "六尾", "九尾", "胖丁", "胖可丁", "超音蝠", "大嘴蝠", "走路草", "臭臭花", "霸王花", "派拉斯", "派拉斯特", "毛球", "摩鲁蛾", "地鼠", "三地鼠", "喵喵", "猫老大", "可达鸭", "哥达鸭", "猴怪", "火暴猴", "卡蒂狗", "风速狗", "蚊香蝌蚪", "蚊香君", "蚊香泳士", "凯西", "勇基拉", "胡地", "腕力", "豪力", "怪力", "喇叭芽", "口呆花", "大食花", "玛瑙水母", "毒刺水母", "小拳石", "隆隆石", "隆隆岩", "小火马", "烈焰马", "呆呆兽", "呆壳兽", "小磁怪", "三合一磁怪", "大葱鸭", "嘟嘟", "嘟嘟利", "小海狮", "白海狮", "臭泥", "臭臭泥", "大舌贝", "刺甲贝", "鬼斯", "鬼斯通", "耿鬼", "大岩蛇", "催眠貘", "引梦貘人", "大钳蟹", "巨钳蟹", "霹雳电球", "顽皮雷弹", "蛋蛋", "椰蛋树", "卡拉卡拉", "嘎啦嘎啦", "飞腿郎", "快拳郎", "大舌头", "瓦斯弹", "双弹瓦斯", "独角犀牛", "钻角犀兽", "吉利蛋", "蔓藤怪", "袋兽", "墨海马", "海刺龙", "角金鱼", "金鱼王", "海星星", "宝石海星", "魔墙人偶", "飞天螳螂", "迷唇姐", "电击兽", "鸭嘴火兽", "凯罗斯", "肯泰罗", "鲤鱼王", "暴鲤龙", "拉普拉斯", "百变怪", "伊布", "水伊布", "雷伊布", "火伊布", "多边兽", "菊石兽", "多刺菊石兽", "化石盔", "镰刀盔", "化石翼龙", "卡比兽", "急冻鸟", "闪电鸟", "火焰鸟", "迷你龙", "哈克龙", "快龙", "超梦", "梦幻", "菊草叶", "月桂叶", "大竺葵", "火球鼠", "火岩鼠", "火暴兽", "小锯鳄", "蓝鳄", "大力鳄", "尾立", "大尾立", "咕咕", "猫头夜鹰", "芭瓢虫", "安瓢虫", "圆丝蛛", "阿利多斯", "叉字蝠", "灯笼鱼", "电灯怪", "皮丘", "皮宝宝", "宝宝丁", "波克比", "波克基古", "天然雀", "天然鸟", "咩利羊", "茸茸羊", "电龙", "美丽花", "玛力露", "玛力露丽", "树才怪", "蚊香蛙皇", "毽子草", "毽子花", "毽子棉", "长尾怪手", "向日种子", "向日花怪", "蜻蜻蜓", "乌波", "沼王", "太阳伊布", "月亮伊布", "黑暗鸦", "呆呆王", "梦妖", "未知图腾", "果然翁", "麒麟奇", "榛果球", "佛烈托斯", "土龙弟弟", "天蝎", "大钢蛇", "布鲁", "布鲁皇", "千针鱼", "巨钳螳螂", "壶壶", "赫拉克罗斯", "狃拉", "熊宝宝", "圈圈熊", "熔岩虫", "熔岩蜗牛", "小山猪", "长毛猪", "太阳珊瑚", "铁炮鱼", "章鱼桶", "信使鸟", "巨翅飞鱼", "盔甲鸟", "戴鲁比", "黑鲁加", "刺龙王", "小小象", "顿甲","多边兽二型", "惊角鹿", "图图犬", "无畏小子", "战舞郎", "迷唇娃", "电击怪", "鸭嘴宝宝", "大奶罐", "幸福蛋", "雷公", "炎帝", "水君", "幼基拉斯", "沙基拉斯", "班基拉斯", "洛奇亚", "凤王", "时拉比", "木守宫", "森林蜥蜴", "蜥蜴王", "火稚鸡", "力壮鸡", "火焰鸡", "水跃鱼", "沼跃鱼", "巨沼怪", "土狼犬", "大狼犬", "蛇纹熊", "直冲熊", "刺尾虫", "甲壳茧", "狩猎凤蝶", "盾甲茧", "毒粉蛾", "莲叶童子", "莲帽小童", "乐天河童", "橡实果", "长鼻叶", "狡猾天狗", "傲骨燕", "大王燕", "长翅鸥", "大嘴鸥", "拉鲁拉丝", "奇鲁莉安", "沙奈朵", "溜溜糖球", "雨翅蛾", "蘑蘑菇", "斗笠菇", "懒人獭", "过动猿", "请假王", "土居忍士", "铁面忍者", "脱壳忍者", "咕妞妞", "吼爆弹", "爆音怪", "幕下力士", "铁掌力士", "露力丽", "朝北鼻", "向尾喵", "优雅猫", "勾魂眼", "大嘴娃", "可可多拉", "可多拉", "波士可多拉", "玛沙那", "恰雷姆", "落雷兽", "雷电兽", "正电拍拍", "负电拍拍", "电萤虫", "甜甜萤", "毒蔷薇", "溶食兽", "吞食兽", "利牙鱼", "巨牙鲨", "吼吼鲸", "吼鲸王", "呆火驼", "喷火驼", "煤炭龟", "跳跳猪", "噗噗猪", "晃晃斑", "大颚蚁", "超音波幼虫", "沙漠蜻蜓", "刺球仙人掌", "梦歌仙人掌", "青绵鸟", "七夕青鸟", "猫鼬斩", "饭匙蛇", "月石", "太阳岩", "泥泥鳅", "鲶鱼王", "龙虾小兵", "铁螯龙虾", "天秤偶", "念力土偶", "触手百合", "摇篮百合", "太古羽虫", "太古盔甲", "丑丑鱼", "美纳斯", "飘浮泡泡", "变隐龙", "怨影娃娃", "诅咒娃娃", "夜巡灵", "彷徨夜灵", "热带龙", "风铃铃", "阿勃梭鲁", "小果然", "雪童子", "冰鬼护", "海豹球", "海魔狮", "帝牙海狮", "珍珠贝", "猎斑鱼", "樱花鱼", "古空棘鱼", "爱心鱼", "宝贝龙", "甲壳龙", "暴飞龙", "铁哑铃", "金属怪", "巨金怪", "雷吉洛克", "雷吉艾斯", "雷吉斯奇鲁", "拉帝亚斯", "拉帝欧斯", "盖欧卡", "固拉多", "烈空坐", "基拉祈", "代欧奇希斯", "草苗龟", "树林龟", "土台龟", "小火焰猴", "猛火猴", "烈焰猴", "波加曼", "波皇子", "帝王拿波", "姆克儿", "姆克鸟", "姆克鹰", "大牙狸", "大尾狸", "圆法师", "音箱蟀", "小猫怪", "勒克猫", "伦琴猫", "含羞苞", "罗丝雷朵", "头盖龙", "战槌龙", "盾甲龙", "护城龙", "结草儿", "结草贵妇", "绅士蛾", "三蜜蜂", "蜂女王", "帕奇利兹", "泳圈鼬", "浮潜鼬", "樱花宝", "樱花儿", "无壳海兔", "海兔兽", "双尾怪手", "飘飘球", "随风球", "卷卷耳", "长耳兔", "梦妖魔", "乌鸦头头", "魅力喵", "东施喵", "铃铛响", "臭鼬噗", "坦克臭鼬", "铜镜怪", "青铜钟", "盆才怪", "魔尼尼", "小福蛋", "聒噪鸟", "花岩怪", "圆陆鲨", "尖牙陆鲨", "烈咬陆鲨", "小卡比兽", "利欧路", "路卡利欧", "沙河马", "河马兽", "钳尾蝎", "龙王蝎", "不良蛙", "毒骷蛙", "尖牙笼", "荧光鱼", "霓虹鱼", "小球飞鱼", "雪笠怪", "暴雪王", "玛狃拉", "自爆磁怪", "大舌舔", "超甲狂犀", "巨蔓藤", "电击魔兽", "鸭嘴炎兽", "波克基斯", "远古巨蜓", "叶伊布", "冰伊布", "天蝎王", "象牙猪", "多边兽乙型", "艾路雷朵", "大朝北鼻", "黑夜魔灵", "雪妖女", "洛托姆", "由克希", "艾姆利多", "亚克诺姆", "帝牙卢卡", "帕路奇亚", "席多蓝恩", "雷吉奇卡斯", "骑拉帝纳", "克雷色利亚", "霏欧纳", "玛纳霏", "达克莱伊", "谢米", "阿尔宙斯", "比克提尼", "藤藤蛇", "青藤蛇", "君主蛇", "暖暖猪", "炒炒猪", "炎武王", "水水獭", "双刃丸", "大剑鬼", "探探鼠", "步哨鼠", "小约克", "哈约克", "长毛狗", "扒手猫", "酷豹", "花椰猴", "花椰猿", "爆香猴", "爆香猿", "冷水猴", "冷水猿", "食梦梦", "梦梦蚀", "豆豆鸽", "咕咕鸽", "高傲雉鸡", "斑斑马", "雷电斑马", "石丸子", "地幔岩", "庞岩怪", "滚滚蝙蝠", "心蝙蝠", "螺钉地鼠", "龙头地鼠", "差不多娃娃", "搬运小匠", "铁骨土人", "修建老匠", "圆蝌蚪", "蓝蟾蜍", "蟾蜍王", "投摔鬼", "打击鬼", "虫宝包", "宝包茧", "保姆虫", "百足蜈蚣", "车轮球", "蜈蚣王", "木棉球", "风妖精", "百合根娃娃", "裙儿小姐", "野蛮鲈鱼", "黑眼鳄", "混混鳄", "流氓鳄", "火红不倒翁", "达摩狒狒", "沙铃仙人掌", "石居蟹", "岩殿居蟹", "滑滑小子", "头巾混混", "象征鸟", "哭哭面具", "迭失棺", "原盖海龟", "肋骨海龟", "始祖小鸟", "始祖大鸟", "破破袋", "灰尘山", "索罗亚", "索罗亚克", "泡沫栗鼠", "奇诺栗鼠", "哥德宝宝", "哥德小童", "哥德小姐", "单卵细胞球", "双卵细胞球", "人造细胞卵", "鸭宝宝", "舞天鹅", "迷你冰", "多多冰", "双倍多多冰", "四季鹿", "萌芽鹿", "电飞鼠", "盖盖虫", "骑士蜗牛", "哎呀球菇", "败露球菇", "轻飘飘", "胖嘟嘟", "保姆曼波", "电电虫", "电蜘蛛", "种子铁球", "坚果哑铃", "齿轮儿", "齿轮组", "齿轮怪", "麻麻小鱼", "麻麻鳗", "麻麻鳗鱼王", "小灰怪", "大宇怪", "烛光灵", "灯火幽灵", "水晶灯火灵", "牙牙", "斧牙龙", "双斧战龙", "喷嚏熊", "冻原熊", "几何雪花", "小嘴蜗", "敏捷虫", "泥巴鱼", "功夫鼬", "师父鼬", "赤面龙", "泥偶小人", "泥偶巨人", "驹刀小兵", "劈斩司令", "爆炸头水牛", "毛头小鹰", "勇士雄鹰", "秃鹰丫头", "秃鹰娜", "熔蚁兽", "铁蚁", "单首龙", "双首暴龙", "三首恶龙", "燃烧虫", "火神蛾", "勾帕路翁", "代拉基翁", "毕力吉翁", "龙卷云", "雷电云", "莱希拉姆", "捷克罗姆", "土地云", "酋雷姆", "凯路迪欧", "美洛耶塔", "盖诺赛克特", "哈力栗", "胖胖哈力", "布里卡隆", "火狐狸", "长尾火狐", "妖火红狐", "呱呱泡蛙", "呱头蛙", "甲贺忍蛙", "掘掘兔", "掘地兔", "小箭雀", "火箭雀", "烈箭鹰", "粉蝶虫", "粉蝶蛹", "彩粉蝶", "小狮狮", "火炎狮", "花蓓蓓", "花叶蒂", "花洁夫人", "坐骑小羊", "坐骑山羊", "顽皮熊猫", "霸道熊猫", "多丽米亚", "妙喵", "超能妙喵", "独剑鞘", "双剑鞘", "坚盾剑怪", "粉香香", "芳香精", "绵绵泡芙", "胖甜妮", "好啦鱿", "乌贼王", "龟脚脚", "龟足巨铠", "垃垃藻", "毒藻龙", "铁臂枪虾", "钢炮臂虾", "伞电蜥", "光电伞蜥", "宝宝暴龙", "怪颚龙", "冰雪龙", "冰雪巨龙", "仙子伊布", "摔角鹰人", "咚咚鼠", "小碎钻", "黏黏宝", "黏美儿", "黏美龙", "钥圈儿", "小木灵", "朽木妖", "南瓜精", "南瓜怪人", "冰宝", "冰岩怪", "嗡蝠", "音波龙", "哲尔尼亚斯", "伊裴尔塔尔", "基格尔德", "蒂安希", "胡帕", "波尔凯尼恩", "木木枭", "投羽枭", "狙射树枭", "火斑喵", "炎热喵", "炽焰咆哮虎", "球球海狮", "花漾海狮", "西狮海壬", "小笃儿", "喇叭啄鸟", "铳嘴大鸟", "猫鼬少", "猫鼬探长", "强颚鸡母虫", "虫电宝", "锹农炮虫", "好胜蟹", "好胜毛蟹", "花舞鸟", "萌虻", "蝶结萌虻", "岩狗狗", "鬃岩狼人", "弱丁鱼", "好坏星", "超坏星", "泥驴仔", "重泥挽马", "滴蛛", "滴蛛霸", "伪螳草", "兰螳花", "睡睡菇", "灯罩夜菇", "夜盗火蜥", "焰后蜥", "童偶熊", "穿着熊", "甜竹竹", "甜舞妮", "甜冷美后", "花疗环环", "智挥猩", "投掷猴", "胆小虫", "具甲武者", "沙丘娃", "噬沙堡爷", "拳海参", "属性空", "银伴战兽", "小陨星", "树枕尾熊", "爆焰龟兽", "托戈德玛尔", "谜拟丘", "磨牙彩皮鱼", "老翁龙", "破破舵轮", "心鳞宝", "鳞甲龙", "杖尾鳞甲龙", "卡璞鸣鸣", "卡璞蝶蝶", "卡璞哞哞", "卡璞鳍鳍", "科斯莫古", "科斯莫姆", "索尔迦雷欧", "露奈雅拉", "虚吾伊德", "爆肌蚊", "费洛美螂", "电束木", "铁火辉夜", "纸御剑", "恶食大王", "奈克洛兹玛", "玛机雅娜", "玛夏多", "毒贝比", "四颚针龙", "垒磊石", "砰头小丑", "捷拉奥拉", "美录坦", "美录梅塔", "敲音猴", "啪咚猴", "轰擂金刚猩", "炎兔儿", "腾蹴小将", "闪焰王牌", "泪眼蜥", "变涩蜥", "千面避役", "贪心栗鼠", "藏饱栗鼠", "稚山雀", "蓝鸦", "钢铠鸦", "索侦虫", "天罩虫", "以欧路普", "狡小狐", "猾大狐", "幼棉棉", "白蓬蓬", "毛辫羊", "毛毛角羊", "咬咬龟", "暴噬龟", "来电汪", "逐电犬", "小炭仔", "大炭车", "巨炭山", "啃果虫", "苹裹龙", "丰蜜龙", "沙包蛇", "沙螺蟒", "古月鸟", "刺梭鱼", "戽斗尖梭", "电音婴", "颤弦蝾螈", "烧火蚣", "焚焰蚣", "拳拳蛸", "八爪武师", "来悲茶", "怖思壶", "迷布莉姆", "提布莉姆", "布莉姆温", "捣蛋小妖", "诈唬魔", "长毛巨魔", "堵拦熊", "喵头目", "魔灵珊瑚", "葱游兵", "踏冰人偶", "迭失板", "小仙奶", "霜奶仙", "列阵兵", "啪嚓海胆", "雪吞虫", "雪绒蛾", "巨石丁", "冰砌鹅", "爱管侍", "莫鲁贝可", "铜象", "大王铜象", "雷鸟龙", "雷鸟海兽", "鳃鱼龙", "鳃鱼海兽", "铝钢龙", "多龙梅西亚", "多龙奇", "多龙巴鲁托", "苍响", "藏玛然特", "无极汰那", "熊徒弟", "武道熊师", "萨戮德", "雷吉艾勒奇", "雷吉铎拉戈", "雪暴马", "灵幽马", "蕾冠王", "诡角鹿", "劈斧螳螂", "月月熊", "幽尾玄鱼", "大狃拉", "万针鱼", "眷恋云", "新叶喵", "蒂蕾喵", "魔幻假面喵", "呆火鳄", "炙烫鳄", "骨纹巨声鳄", "润水鸭", "涌跃鸭", "狂欢浪舞鸭", "爱吃豚", "飘香豚", "团珠蛛", "操陷蛛", "豆蟋蟀", "烈腿蝗", "布拨", "布土拨", "巴布土拨", "一对鼠", "一家鼠", "狗仔包", "麻花犬", "迷你芙", "奥利纽", "奥利瓦", "怒鹦哥", "盐石宝", "盐石垒", "盐石巨灵", "炭小侍", "红莲铠骑", "苍炎刃鬼", "光蚪仔", "电肚蛙", "电海燕", "大电海燕", "偶叫獒", "獒教父", "滋汁鼹", "涂标客", "纳噬草", "怖纳噬草", "原野水母", "陆地水母", "毛崖蟹", "热辣娃", "狠辣椒", "虫滚泥", "虫甲圣", "飘飘雏", "超能艳鸵", "小锻匠", "巧锻匠", "巨锻匠", "海地鼠", "三海地鼠", "下石鸟", "波普海豚", "海豚侠", "噗隆隆", "普隆隆姆", "摩托蜥", "拖拖蚓", "晶光芽", "晶光花", "墓仔狗", "墓扬犬", "缠红鹤", "走鲸", "浩大鲸", "轻身鳕", "吃吼霸", "米立龙", "弃世猴", "土王", "奇麒麟", "土龙节节", "仆刀将军", "雄伟牙", "吼叫尾", "猛恶菇", "振翼发", "爬地翅", "沙铁皮", "铁辙迹", "铁包袱", "铁臂膀", "铁脖颈", "铁毒蛾", "铁荆棘", "凉脊龙", "冻脊龙", "戟脊龙", "索财灵", "赛富豪", "古简蜗", "古剑豹", "古鼎鹿", "古玉鱼", "轰鸣月", "铁武者", "故勒顿", "密勒顿", "波荡水", "铁斑叶", "裹蜜虫", "斯魔茶", "来悲粗茶", "够赞狗", "愿增猿", "吉雉鸡", "厄诡椪", "铝钢桥龙", "蜜集大蛇", "破空焰", "猛雷鼓", "铁磐岩", "铁头壳", "太乐巴戈斯", "桃歹郎"]
  // rz*
  const logger = ctx.logger(`wordleGame`)
  // wj*
  const wordleGameDirPath = path.join(ctx.baseDir, 'data', 'wordleGame');
  const idiomsFilePath = path.join(__dirname, 'assets', '宝可兜', 'idioms.json');
  const pinyinFilePath = path.join(__dirname, 'assets', '宝可兜', 'pinyin.json');
  const strokesFilePath = path.join(__dirname, 'assets', '宝可影', 'strokes.json');

  const idiomsKoishiFilePath = path.join(wordleGameDirPath, 'idioms.json');
  const pinyinKoishiFilePath = path.join(wordleGameDirPath, 'pinyin.json');

  await ensureDirExists(wordleGameDirPath);
  await ensureFileExists(idiomsKoishiFilePath);
  await ensureFileExists(pinyinKoishiFilePath);

  await updateDataInTargetFile(idiomsFilePath, idiomsKoishiFilePath, 'idiom');
  await updateDataInTargetFile(pinyinFilePath, pinyinKoishiFilePath, 'term');

  const idiomsData = fs.readFileSync(idiomsKoishiFilePath, 'utf-8');
  const strokesData = JSON.parse(fs.readFileSync(strokesFilePath, 'utf-8'));
  const pinyinData: PinyinItem2[] = JSON.parse(fs.readFileSync(pinyinKoishiFilePath, 'utf8'));
  const idiomsList = JSON.parse(idiomsData);
  // tzb*
  ctx.model.extend('p_wordle_game_records', {
    id: 'unsigned',
    channelId: 'string',
    isStarted: 'boolean',
    remainingGuessesCount: 'integer',
    strokesHtmlCache: { type: 'json', initial: [[], [], [], [], []] },
    wordAnswerChineseDefinition: 'string',
    wordGuess: 'string',
    wordGuessHtmlCache: 'text',
    guessWordLength: 'unsigned',
    gameMode: 'string',
    isRunning: 'boolean',
    timestamp: 'string',
    correctLetters: 'list',
    presentLetters: 'string',
    absentLetters: 'string',
    isHardMode: 'boolean',
    remainingWordsList: 'list',
    isAbsurd: 'boolean',
    isChallengeMode: 'boolean',
    targetWord: 'string',
    wordlesNum: 'unsigned',
    wordleIndex: 'unsigned',
    isWin: 'boolean',
    isUltraHardMode: 'boolean',
    presentLettersWithIndex: 'list',
    pinyin: 'string',
    presentTonesWithIndex: 'list',
    absentPinyins: 'list',
    absentTones: 'list',
    presentPinyinsWithIndex: 'list',
    correctTonesWithIndex: 'list',
    correctPinyinsWithIndex: 'list',
    presentPinyins: 'list',
    presentTones: 'list',
    isFreeMode: 'boolean',
    previousGuess: 'list',
    previousGuessIdioms: 'list',
  }, {
    primary: 'id',
    autoInc: true,
  })
  ctx.model.extend('p_extra_wordle_game_records', {
    id: 'unsigned',
    channelId: 'string',
    wordAnswerChineseDefinition: 'string',
    wordGuess: 'string',
    wordGuessHtmlCache: 'text',
    strokesHtmlCache: { type: 'json', initial: [[], [], [], [], []] },
    guessWordLength: 'unsigned',
    gameMode: 'string',
    timestamp: 'string',
    correctLetters: 'list',
    presentLetters: 'string',
    absentLetters: 'string',
    wordlesNum: 'unsigned',
    wordleIndex: 'unsigned',
    isWin: 'boolean',
    remainingGuessesCount: 'integer',
    presentLettersWithIndex: 'list',
    pinyin: 'string',
    presentTonesWithIndex: 'list',
    absentPinyins: 'list',
    absentTones: 'list',
    presentPinyinsWithIndex: 'list',
    correctTonesWithIndex: 'list',
    correctPinyinsWithIndex: 'list',
    presentPinyins: 'list',
    presentTones: 'list',
    previousGuess: 'list',
    previousGuessIdioms: 'list',
  }, {
    primary: 'id',
    autoInc: true,
  })
  ctx.model.extend('p_wordle_gaming_player_records', {
    id: 'unsigned',
    channelId: 'string',
    username: 'string',
    money: 'unsigned',
    userId: 'string',
  }, {
    primary: 'id',
    autoInc: true,
  })
  ctx.model.extend('p_wordle_player_records', {
    id: 'unsigned',
    username: 'string',
    userId: 'string',
    lose: 'unsigned',
    win: 'unsigned',
    moneyChange: 'double',
    wordGuessCount: 'unsigned',
    stats: { type: 'json', initial: initialStats },
    fastestGuessTime: { type: 'json', initial: initialFastestGuessTime },
    extraCiyingRankInfo: { type: 'json', initial: initialExtraCiyingRankInfo },
  }, {
    primary: 'id',
    autoInc: true,
  })
  // zl*
  exams.forEach((exam) => {
    // ks*
    ctx.command(`开始猜名/${exam}`, `${exam}`)
      .option('free', '--free 自由模式', { fallback: false })
      .option('hard', '--hard 困难模式', { fallback: false })
      .option('ultraHardMode', '--uhard 超困难模式', { fallback: false })
      .option('wordles', '--wordles <value:number> 同时猜测多个', { fallback: 1 })
      .action(async ({ session, options }) => {
        let { channelId, userId, username, timestamp, platform } = session;
        const [player]:Pokebattle[]=await ctx.database.get('pokebattle',userId)
        if(!player){
          await session.execute('签到')
        }
        username = await getSessionUserName(session)
        await updateNameInPlayerRecord(session, userId, username)
        if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
          await sendMessage(session, `<@${session.userId}>\n附加游戏模式（可多选）：`, `困难 超困难 x1 x2 x3 x4 自由 跳过`, 2);

          const userInput = await session.prompt();

          if (!userInput) {
            return await sendMessage(session, `<@${session.userId}>\n输入无效或超时。`, `改名 开始游戏 查看信息`);
          }

          options.free = userInput.includes(`自由`);

          for (const mode of Object.keys(modes)) {
            if (userInput.includes(mode)) {
              options[modes[mode]] = true;
            }
          }

          for (const wordle of Object.keys(wordlesMap)) {
            if (userInput.includes(wordle)) {
              options.wordles = wordlesMap[wordle];
            }
          }

          if (userInput.includes(`跳过`)) {
            noop();
          }
        }

        if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > config.maxSimultaneousGuesses) {
          return await sendMessage(session, `<@${session.userId}>\n您输入的参数值无效！\n如果您想同时猜测多个的话~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`, `改名 开始游戏`);
        }

        // 游戏状态
        const gameInfo = await getGameInfo(channelId);
        if (gameInfo.isStarted) {
          return await sendMessage(session, `<@${session.userId}>\n游戏已经开始了哦~`, `猜测`);
        }

        const selectedWords: string[] = [];

        let guessWordLength: number;
        let randomWord: string
        let translation: string
        let pinyin: string
        const  randomIdiom = getRandomFromStringList(commonIdiomsList)
        let selectedIdiom;


        selectedIdiom = await getSelectedIdiom(randomIdiom);

        guessWordLength = selectedIdiom.idiom.length;
        pinyin = selectedIdiom.pinyin;
        randomWord = randomIdiom;
        translation = selectedIdiom.explanation;
        selectedWords.push(randomWord);
        let isFreeMode = options.free;
        let isHardMode = options.hard;
        let isUltraHardMode = options.ultraHardMode;
        const wordlesNum = options.wordles
        if (isUltraHardMode) {
          isHardMode = true
        }

        const correctLetters: string[] = new Array(guessWordLength).fill('*');

        await ctx.database.set('p_wordle_game_records', { channelId }, {
          isStarted: true,
          wordGuess: randomWord,
          wordAnswerChineseDefinition: replaceEscapeCharacters(translation),
          remainingGuessesCount: exam === '宝可兜' ? 10 + wordlesNum - 1 : 6 + wordlesNum - 1,
          guessWordLength,
          gameMode: exam,
          timestamp: String(timestamp),
          isHardMode: isHardMode,
          isUltraHardMode,
          correctLetters: correctLetters,
          presentLetters: '',
          absentLetters: '',
          targetWord: randomWord,
          wordlesNum: wordlesNum,
          wordleIndex: 1,
          pinyin,
          isFreeMode,
        })

        if (wordlesNum > 1) {
          let randomWordExtra: string = ''
          let translation: string = ''
          let pinyin: string = ''
          for (let wordleIndex = 2; wordleIndex < wordlesNum + 1; wordleIndex++) {

            while (selectedWords.length < wordleIndex) {
              let randomIdiom = getRandomFromStringList(commonIdiomsList);
              let selectedIdiom;


                selectedIdiom = await getSelectedIdiom(randomIdiom);
                while (selectedIdiom.idiom.length !== guessWordLength) {
                  randomIdiom = getRandomFromStringList(commonIdiomsList);
                  selectedIdiom = await getSelectedIdiom(randomIdiom);
                }
              

              pinyin = selectedIdiom.pinyin
              randomWordExtra = randomIdiom;
              translation = selectedIdiom.explanation

              if (!selectedWords.includes(randomWordExtra)) {
                selectedWords.push(randomWordExtra);
              }
            }
            await ctx.database.create('p_extra_wordle_game_records', {
              channelId,
              remainingGuessesCount: exam === '宝可兜' ? 10 + wordlesNum - 1 : 6 + wordlesNum - 1,
              guessWordLength,
              wordGuess: randomWordExtra,
              wordAnswerChineseDefinition: replaceEscapeCharacters(translation),
              gameMode: exam,
              timestamp: String(timestamp),
              correctLetters: correctLetters,
              presentLetters: '',
              absentLetters: '',
              wordlesNum: wordlesNum,
              wordleIndex,
              pinyin,
            })
          }
        }

        let imageBuffer: Buffer = Buffer.from('initial value', 'utf-8');
        if (exam === '宝可兜') {
          const emptyGridHtml = generateEmptyGridHtmlForHandle(1, guessWordLength)
          imageBuffer = await generateImageForHandle(emptyGridHtml);
        } else if (exam === '宝可影') {
          const emptyGridHtmlWithBorder = generateEmptyGridHtmlForCiying(1, guessWordLength, true)
          const emptyGridHtml = generateEmptyGridHtmlForCiying(6 + wordlesNum - 1 - 1, guessWordLength, false)
          imageBuffer = await generateImageForCiying(emptyGridHtmlWithBorder + emptyGridHtml, 6 + wordlesNum - 1);
        }

        let imageBuffers: Buffer[] = [];
        if (wordlesNum > 1) {
          for (let wordleIndex = 0; wordleIndex < wordlesNum; wordleIndex++) {
            imageBuffers.push(imageBuffer);
          }
          const htmlImgString = generateImageTags(imageBuffers);
          imageBuffer = await generateWordlesImage(htmlImgString);
        }

        const gameMode = `游戏开始！\n当前游戏模式为：【${exam}${wordlesNum > 1 ? `（x${wordlesNum}）` : ''}${isFreeMode ? `（自由）` : ''}${isHardMode ? `（${isUltraHardMode ? '超' : ''}困难）` : ''}】`;
        const guessChance = `猜测机会为：【${10 + wordlesNum - 1}】`;
        const wordCount2 = `待猜数量为：【${commonIdiomsList.length}】`;
        const timeLimit = config.enableWordGuessTimeLimit ? `\n作答时间为：【${config.wordGuessTimeLimitInSeconds}】秒` : '';
        const image = h.image(imageBuffer, `image/${config.imageType}`);

        if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
          let dimensions = imageSize(imageBuffer)
          const url = await toUrl(ctx, session, imageBuffer)
          const md = `![img#${dimensions.width}px #${dimensions.height}px](${url})
${gameMode}
${guessChance}
${wordCount2}${timeLimit}`
          return await sendMessage(session, md, `结束游戏 猜测`, 2)
        } else {
          return await sendMessage(session, `${gameMode}\n${guessChance}\n${wordCount2}${timeLimit}\n${image}`, `结束游戏 猜测`);
        }

      });

  })

  ctx.command('未知图腾').action(async ({ session }) => {
    const [player]: Pokebattle[] = await ctx.database.get('pokebattle', session.userId)
    if (!player) {
      await session.execute('签到')
      return
    }
    if (player.lap < 3) return '三周目后才可使用未知图腾召唤神兽'
    const unknowns = player.unknowns_bag
    const pokeDex = new Pokedex(player)
    if (pokeDex.check('346.346')) {
      return '你已经拥有了雷吉奇卡斯'
    }
    if (unknowns.length < 28) {
      const md=`<@${session.userId}>未知图腾
---
\`\`\`
${unknowns.map((u) => `${u.name}`).join('\n')}
\`\`\``
      await sendMarkdown(ctx,md, session)
      return
    }
    pokeDex.pull('346.346', player)
    if (player?.ultra['346.346'] === undefined) {
      player.ultra['346.346'] = 10
    }
    player.ultra['346.346'] = 10
    await ctx.database.set('pokebattle', { id: session.userId }, {
      fossil_bag: player.fossil_bag,
      ultra: player.ultra,
      pokedex: player.pokedex,
      cyberMerit: 0
    })
    const getMd = `<@${session.userId}>成功获得
![img#512px #512px](${await toUrl(ctx, session, `${(pokemonCal.pokemomPic('346.346', false)).toString().match(/src="([^"]*)"/)[1]}`)})
---
![img#20px #20px](${await toUrl(ctx, session, `${config.图片源}/sr/346.png`)}) : ${player.ultra['346.346'] * 10}% ${'🟩'.repeat(Math.floor(player.ultra['346.346'] / 2)) + '🟨'.repeat(player.ultra['341.341'] % 2) + '⬜⬜⬜⬜⬜'.substring(Math.round(player.ultra['341.341'] / 2))}
                  
---
**传说宝可梦——${pokemonCal.pokemonlist('346.346')}**
            
已经放入图鉴`

    await sendMarkdown(ctx,getMd, session)

  })
  // 猜 c* cdc* ccy*
  ctx.command('猜 [inputWord:text]', '做出一次猜测')
    .option('random', '-r 随机', { fallback: false })
    .action(async ({ session, options }, inputWord) => {
      const [player]: Pokebattle[] = await ctx.database.get('pokebattle', session.userId)
      const resource = await isResourceLimit(session.userId, ctx)
      const rLimit = new PrivateResource(resource.resource.goldLimit)
      if (!player) {
        await session.execute('签到')
        return
      }
      let { channelId, userId, username, platform, timestamp } = session
      // 游戏状态
      let gameInfo: any = await getGameInfo(channelId)
      inputWord = inputWord?.trim()

      // 操作太快
      if (gameInfo.isRunning === true) {
        await setGuessRunningStatus(channelId, false)
        return await sendMessage(session, `<@${session.userId}>\n操作太快了哦~\n再试一次吧！`, `猜测`);
      }

      // 运行状态
      await setGuessRunningStatus(channelId, true)
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)

      if (!gameInfo.isStarted) {
        await setGuessRunningStatus(channelId, false)
        return await sendMessage(session, `<@${session.userId}>\n游戏还没开始呢！`, `改名 开始游戏`);
      }

      if (options.random) {
        inputWord = getRandomIdiom(idiomsList).idiom
      }

      if (!inputWord) {
        await sendMessage(session, `<@${session.userId}>\n请输入【猜测词】或【取消】：`, `取消 输入`);
        const userInput = await session.prompt()
        if (!userInput) return await sendMessage(session, `【${username}】\n输入无效或超时。`, `猜测`);
        if (userInput === '取消') return await sendMessage(session, `【${username}】\n猜测操作已取消！`, `猜测`);
        inputWord = userInput.trim()
      }


      // 作答时间限制
      const timeDifferenceInSeconds = (timestamp - Number(gameInfo.timestamp)) / 1000; // 将时间戳转换为秒
      if (config.enableWordGuessTimeLimit) {
        if (timeDifferenceInSeconds > config.wordGuessTimeLimitInSeconds) {
          // // 生成 html 字符串
          // const emptyGridHtml = gameInfo.isAbsurd ? generateEmptyGridHtml(1, gameInfo.guessWordLength) : generateEmptyGridHtml(gameInfo.remainingGuessesCount, gameInfo.guessWordLength);
          // const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
          // // 图
          // const imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
          // 玩家记录输
          await updatePlayerRecordsLose(channelId, gameInfo)
          await endGame(channelId)
          return await sendMessage(session, `<@${session.userId}>\n作答时间超过【${config.wordGuessTimeLimitInSeconds}】秒！\n很遗憾，你们输了!\n下次猜快点吧~`, `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`, 2);
          // return await sendMessage(session, `<@${session.userId}>\n作答时间超过【${config.wordGuessTimeLimitInSeconds}】秒！\n很遗憾，你们输了!\n下次猜快点吧~\n${h.image(imageBuffer, `image/${config.imageType}`)}`)
        }
      }
      // 玩家不在游戏中
      const isInGame = await isPlayerInGame(channelId, userId);
      if (!isInGame) {
        await ctx.database.create('p_wordle_gaming_player_records', { channelId, userId, username, money: 0 })
      }
      let {
        correctLetters,
        presentLetters,
        isHardMode,
        absentLetters,
        isAbsurd,
        remainingWordsList,
        gameMode,
        guessWordLength,
        isChallengeMode,
        targetWord,
        wordlesNum,
        isUltraHardMode,
        presentLettersWithIndex,
        isFreeMode,
      } = gameInfo;
      if (!isLengthCharacterIdiom(inputWord, guessWordLength)) {
        await setGuessRunningStatus(channelId, false)
        return await sendMessage(session, `<@${session.userId}>\n您确定您输入的是**${guessWordLength}**个字名称吗？`, `猜测`);
      }
      // 小写化
      const lowercaseInputWord = inputWord
      let userInputPinyin: string = ''
      if (gameMode === '宝可影') {
        if (!checkStrokesData(inputWord)) {
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `<@${session.userId}>\n不好意思啊...\n我还没学会这个（`, `猜测`);
        }
        if (!isIdiomInList(inputWord, idiomsList) && !isFreeMode) {
          const idiomInfo = await getIdiomInfo(inputWord)
          if (idiomInfo.pinyin === '未找到拼音') {
            await setGuessRunningStatus(channelId, false)
            return await sendMessage(session, `<@${session.userId}>\n你确定存在这样的宝可梦吗？`, `猜测`);
          } else {
            userInputPinyin = idiomInfo.pinyin
          }
        }
      }
      if (gameMode === '宝可兜') {
        if (!isIdiomInList(inputWord, idiomsList)) {
          if (isFreeMode) {
            const foundItem = pinyinData.find(item => item.term === inputWord);

            if (foundItem) {
              userInputPinyin = foundItem.pinyin
            } else {
              userInputPinyin = await sendPostRequestForGPT1106(inputWord)
              if (userInputPinyin !== '') {
                const newItem: PinyinItem2 = {
                  term: inputWord,
                  pinyin: userInputPinyin
                };
                pinyinData.push(newItem);

                fs.writeFileSync(pinyinKoishiFilePath, JSON.stringify(pinyinData, null, 2), 'utf8');
              } else {
                userInputPinyin = 'wǒ chū cuò le'
              }
            }
          } else {
            const idiomInfo = await getIdiomInfo(inputWord)
            if (idiomInfo.pinyin === '未找到拼音') {
              await setGuessRunningStatus(channelId, false)
              return await sendMessage(session, `<@${session.userId}>\n你确定存在这样的宝可梦吗？`, `猜测`);
            } else {
              userInputPinyin = idiomInfo.pinyin
            }
          }

        }
      }
      const foundIdiom = findIdiomByIdiom(inputWord, idiomsList);
      if (!userInputPinyin && foundIdiom) {
        userInputPinyin = foundIdiom.pinyin
      }
      // 困难模式
      if (isHardMode && gameMode !== '宝可影') {
        let isInputWordWrong = false;
        // 包含
        const containsAllLetters = lowercaseInputWord.split('').filter(letter => presentLetters.includes(letter) && letter !== '*');
        if (mergeSameLetters(containsAllLetters).length !== presentLetters.length && presentLetters.length !== 0) {
          isInputWordWrong = true;
        }
        // 正确
        for (let i = 0; i < lowercaseInputWord.length; i++) {
          if (correctLetters[i] !== '*' && correctLetters[i] !== lowercaseInputWord[i] && correctLetters.some(letter => letter !== '*')) {
            isInputWordWrong = true;
            break;
          }
        }
        // 不包含 灰色的线索必须被遵守  超困难
        if (isUltraHardMode && absentLetters.length !== 0 && checkAbsentLetters(lowercaseInputWord, absentLetters)) {
          isInputWordWrong = true;
        }
        // 黄色字母必须远离它们被线索的地方 超困难
        if (isUltraHardMode && presentLettersWithIndex.length !== 0 && checkPresentLettersWithIndex(lowercaseInputWord, presentLettersWithIndex)) {
          isInputWordWrong = true
        }
        if (isInputWordWrong) {
          await setGuessRunningStatus(channelId, false);
          const difficulty = isUltraHardMode ? '超困难' : '困难';
          const rule = `绿色线索必须保特固定，黄色线索必须重复使用。${isUltraHardMode ? `\n黄色线索必须远离它们被线索的地方，灰色的线索必须被遵守。` : ''}`

          const message = `<@${session.userId}>\n当前难度为：【${difficulty}】\n【${difficulty}】：${rule}\n您输入的词不符合要求！\n您的输入为：【${inputWord}】\n要求：【${correctLetters.join('')}】${presentLetters.length === 0 ? `` : `\n包含：【${presentLetters}】`}${absentLetters.length === 0 || !isUltraHardMode ? `` : `\n不包含：【${absentLetters}】`}${presentLettersWithIndex.length === 0 || !isUltraHardMode ? `` : `\n远离黄色线索：【${presentLettersWithIndex.join(', ')}】`}`;

          return await sendMessage(session, message, `猜测`);
        }
      }
      // 初始化输
      let isLose = false
      // 胜
      let isWin = false
      if (wordlesNum === 1 && lowercaseInputWord === gameInfo.wordGuess) {
        isWin = true
      }
      let isWinNum = 0
      // 生成 html 字符串
      let imageBuffers: Buffer[] = [];
      let imageBuffer: Buffer = Buffer.from('initial value', 'utf-8');
      for (let wordleIndex = 1; wordleIndex < wordlesNum + 1; wordleIndex++) {
        if (wordleIndex > 1) {
          gameInfo = await getGameInfo2(channelId, wordleIndex)
        }
        const isWin = lowercaseInputWord === gameInfo.wordGuess
        if (isWin || gameInfo.isWin) {
          ++isWinNum
        }
        // 负
        if (!isWin && gameInfo.remainingGuessesCount - 1 === 0 && !isAbsurd) {
          isLose = true
        }
        let letterTilesHtml: string;

        if (gameInfo.isWin) {
          letterTilesHtml = '';
        } else {
          if (gameMode === '宝可兜') {
            letterTilesHtml = await generateLetterTilesHtmlForHandle(gameInfo.wordGuess, inputWord, channelId, wordleIndex, gameInfo, gameInfo.pinyin, userInputPinyin);
          } else if (gameMode === '宝可影') {
            letterTilesHtml = await generateLetterTilesHtmlForCiying(gameInfo.wordGuess, inputWord, channelId, wordleIndex, gameInfo, isHardMode);
          } else {
            const generatedHtml = await generateLetterTilesHtml(gameInfo.wordGuess, inputWord, channelId, wordleIndex, gameInfo);
            letterTilesHtml = '<div class="Row-module_row__pwpBq">' + generatedHtml + '</div>';
          }
        }
        let emptyGridHtml;
        if (isAbsurd) {
          emptyGridHtml = generateEmptyGridHtml(isWin ? 0 : 1, gameInfo.guessWordLength);
        } else {
          if (gameMode === '宝可兜') {
            emptyGridHtml = generateEmptyGridHtmlForHandle(gameInfo.isWin || isWin ? 0 : isLose ? 0 : 1, guessWordLength)
          } else if (gameMode === '宝可影') {
            emptyGridHtml = generateEmptyGridHtmlForCiying(gameInfo.isWin || isWin ? 0 : isLose ? 0 : 1, guessWordLength, true) + generateEmptyGridHtmlForCiying(gameInfo.isWin || isWin ? gameInfo.remainingGuessesCount - 1 : gameInfo.remainingGuessesCount - 1 - 1, guessWordLength, false)
          } else {
            emptyGridHtml = generateEmptyGridHtml(gameInfo.isWin ? gameInfo.remainingGuessesCount : gameInfo.remainingGuessesCount - 1, gameInfo.guessWordLength);
          }
        }
        const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
        // 图
        if (gameMode === '宝可兜') {
          imageBuffer = await generateImageForHandle(`${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`);
        } else if (gameMode === '宝可影') {
          imageBuffer = await generateImageForCiying(`${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`, 6 + wordlesNum - 1);
        }
        imageBuffers.push(imageBuffer);
        // 更新游戏记录
        const remainingGuessesCount = isAbsurd || gameMode === '宝可影' && (gameInfo.isWin || isWin) ? gameInfo.remainingGuessesCount : gameInfo.remainingGuessesCount - 1
        if (wordleIndex === 1 && !gameInfo.isWin) {
          await ctx.database.set('p_wordle_game_records', { channelId }, {
            isWin,
            remainingGuessesCount: remainingGuessesCount,
            wordGuessHtmlCache: `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n`,
          })
        } else if (wordleIndex > 1 && !gameInfo.isWin) {
          await ctx.database.set('p_extra_wordle_game_records', { channelId, wordleIndex }, {
            isWin,
            remainingGuessesCount: remainingGuessesCount,
            wordGuessHtmlCache: `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n`,
          })
        }
      }
      if (wordlesNum > 1) {
        const htmlImgString = generateImageTags(imageBuffers);
        imageBuffer = await generateWordlesImage(htmlImgString);
        if (isWinNum === wordlesNum) {
          isWin = true
        }
      }
      gameInfo = await getGameInfo(channelId)
      // 处理赢       
      if (isWin) {
        const order = 'abcdefghijklmnopqrstuvwxyz?!'
        const getUnknown = getUknowns()
        const isUnknown = player.unknowns_bag.some(item => item.id === getUnknown.id)
        const hasUnknown = (isUnknown || player.lap !== 3)
        hasUnknown ? null : player.unknowns_bag.push(getUnknown)
        player.vip > 0 ? await rLimit.addGold(ctx, 0.5, session.userId) : null
        const legendaryPokemonRandom = Math.random() * 100
        const addMerits = player.cyberMerit > 95 ? ((100 - player.cyberMerit) <= 0 ? 0 : (100 - player.cyberMerit)) : 5
        const isEvent = player.lap < 3 || player.level < 90
        await ctx.database.set('pokebattle', { id: session.userId }, row => ({
          unknowns_bag:player.unknowns_bag.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)),
          gold: $.if($.lt(row.lap, 3), $.add(row.gold, 750 * gameInfo.remainingGuessesCount), row.gold),
          cyberMerit:  $.add(row.cyberMerit, addMerits),
        }))
        if (player.lap == 3) {
          await ctx.database.set('pokemon.resourceLimit', { id: session.userId }, row => ({
            rankScore: $.if($.eq(player.lap, 3), $.add(row.rankScore, 50 * gameInfo.remainingGuessesCount), row.rankScore)
          }))
        }
        let finalSettlementString: string = ''
        // 玩家记录赢
        await updatePlayerRecordsWin(channelId, gameInfo)
        // 增加该玩家猜出单词的次数
        const [playerRecord] = await ctx.database.get('p_wordle_player_records', { userId })
        // 更新最快用时
        if (timeDifferenceInSeconds < playerRecord.fastestGuessTime[gameInfo.gameMode] || playerRecord.fastestGuessTime[gameInfo.gameMode] === 0) {
          playerRecord.fastestGuessTime[gameInfo.gameMode] = Math.floor(timeDifferenceInSeconds);
        }

        if (gameInfo.gameMode === '宝可影') {
          if (gameInfo.wordlesNum === 1) {
            if (gameInfo.isHardMode) {
              playerRecord.extraCiyingRankInfo.successCountIn1HardMode += 1;
              if (timeDifferenceInSeconds < playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1HardMode || playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1HardMode === 0) {
                playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1HardMode = Math.floor(timeDifferenceInSeconds);
              }
            } else {
              playerRecord.extraCiyingRankInfo.successCountIn1Mode += 1;
              if (timeDifferenceInSeconds < playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1Mode || playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1Mode === 0) {
                playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1Mode = Math.floor(timeDifferenceInSeconds);
              }
            }
          } else if (gameInfo.wordlesNum >= 2 && gameInfo.wordlesNum <= 4) {
            const extraCiyingRankInfoKey = `successCountIn${gameInfo.wordlesNum}Mode`;
            const extraCiyingRankInfoKeyFastestGuessTimeIn = `fastestGuessTimeIn${gameInfo.wordlesNum}Mode`;
            playerRecord.extraCiyingRankInfo[extraCiyingRankInfoKey] += 1;
            if (timeDifferenceInSeconds < playerRecord.extraCiyingRankInfo[extraCiyingRankInfoKeyFastestGuessTimeIn] || playerRecord.extraCiyingRankInfo[extraCiyingRankInfoKeyFastestGuessTimeIn] === 0) {
              playerRecord.extraCiyingRankInfo[extraCiyingRankInfoKeyFastestGuessTimeIn] = Math.floor(timeDifferenceInSeconds);
            }
          }
        }

        const updateData = {
          wordGuessCount: playerRecord.wordGuessCount + 1,
          fastestGuessTime: playerRecord.fastestGuessTime
        };

        if (gameInfo.gameMode === '宝可影') {
          updateData['extraCiyingRankInfo'] = playerRecord.extraCiyingRankInfo;
        }

        await ctx.database.set('p_wordle_player_records', { userId: userId }, updateData);

        const processedResult: string = wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : '';
        await endGame(channelId)
        const gameDuration = calculateGameDuration(Number(gameInfo.timestamp), timestamp);
        const imageType = config.imageType;
        const settlementResult = finalSettlementString === '' ? '' : `最终结算结果如下：\n${finalSettlementString}`;

        const message = `
<@${session.userId}>
太棒了，你猜出来了！
${gameDuration}
${h.image(imageBuffer, `image/${imageType}`)}
${generateGameEndMessage(gameInfo)}${processedResult}
${settlementResult}
`;

        if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
          if(getUnknown.id=='!'){getUnknown.id='gt'}
          if(getUnknown.id=='?'){getUnknown.id='wh'}
          const unUrl=await toUrl(ctx, session, `file://${resolve(__dirname, `../../assets/img/unknown/${getUnknown.id}.png`)}`)
          let dimensions = imageSize(imageBuffer)
          const url = await toUrl(ctx, session, imageBuffer)
          const events =`赛博功德+5`+ ((legendaryPokemonRandom > (99 - player.cyberMerit * 0.02)) ? `有个身影为你点赞` : ``)
          const md = `![img#${dimensions.width}px #${dimensions.height}px](${url})
<@${session.userId}>
太棒了，你猜出来了！
${player.lap==3 ?`积分+${50*gameInfo.remainingGuessesCount}`:`金币+${750*gameInfo.remainingGuessesCount}`} ${player.vip>0?`金币上限+5000`:``}
${!isEvent ? events : ''}
${player.lap==3 ? (!isUnknown ? `![img#20px #20px](${unUrl})你获得了${getUnknown.name}` : `你已经有了${getUnknown.name}`) : ''}
${gameDuration}
${generateGameEndMessage(gameInfo)}${processedResult}
${settlementResult}`
          await sendMessage(session, md, `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode} ？？未知图腾`, 2);
          if (legendaryPokemonRandom > (99 - player.cyberMerit * 0.02)&&!isEvent) {
            const key = crypto.createHash('md5').update(session.userId + new Date().getTime()).digest('hex').toUpperCase()
            legendaryPokemonId[key] = '347.347'
            ctx.setTimeout(() => {
              delete legendaryPokemonId[key]
            }, 2000)
            await session.execute(`捕捉宝可梦 ${key}`)
          }
          return
        }
        return await sendMessage(session, message, `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`, 2);
      }
      // 处理输
      if (isLose) {
        // 玩家记录输
        await updatePlayerRecordsLose(channelId, gameInfo)
        const processedResult: string = wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : '';
        await endGame(channelId)
        const challengeMessage = isChallengeMode ? `\n目标单词为：【${targetWord}】\n它不再是可能的秘密单词！` : '';
        const answerInfo = isChallengeMode ? '' : `\n${generateGameEndMessage(gameInfo)}`;
        const gameDuration = calculateGameDuration(Number(gameInfo.timestamp), timestamp);
        const message = `很遗憾，你们没有猜出来！${challengeMessage}\n但没关系~下次加油哇！\n${h.image(imageBuffer, `image/${config.imageType}`)}\n${gameDuration}${answerInfo}${processedResult}`;

        if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
          let dimensions = imageSize(imageBuffer)
          const url = await toUrl(ctx, session, imageBuffer)
          const md = `![img#${dimensions.width}px #${dimensions.height}px](${url})
很遗憾，你们没有猜出来！${challengeMessage}
但没关系~下次加油哇！
${gameDuration}${answerInfo}${processedResult}`
          return await sendMessage(session, md, `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode} ？？未知图腾`, 2);
        }
        return await sendMessage(session, message, `改名 排行榜 查询玩家记录 开始游戏 再来一把`, 2);
      }
      // 继续
      await setGuessRunningStatus(channelId, false)
      let dimensions = imageSize(imageBuffer)
      const url = await toUrl(ctx, session, imageBuffer)
      const md = `![img#${dimensions.width}px #${dimensions.height}px](${url})`
      if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
        return sendMessage(session, md, `结束游戏 ${gameInfo.gameMode === '宝可兜' ? `拼音速查表 ` : ``}查询进度 ？？未知图腾 猜测`, 2);
      }
      return
      // .action
    }
    )

    ctx.command('玩法介绍', '玩法介绍').action(async ({ session }) => {
      const md=`
# 宝可猜名
      
---
## 宝可兜
      
- 格子数为待猜的宝可梦的名字字数，当你猜一个后，在名字上面会出现拼音，绿色即为正确，黄色为位置不对，灰色为当前名字里没有这个拼音。
      
## 宝可影
      
- 格子数为待猜的宝可梦的名字字数，当你猜一个后，会有重叠的笔画出现，笔画越接近，颜色越深（黑色或是灰色）。当笔画完全正确，则是绿色.
      
> 奖励：VIP将多获得5000的当日金币获取上限。3周目为积分0-500不等并且会获得一个未知图腾，用来召唤雷吉奇卡斯 。1、2周目为金币0-7500不等。
`
      await sendMarkdown(ctx,md, session)
    })
  // 查询进度 jd* cxjd*
  ctx.command('查询进度', '查询当前游戏进度')
    .action(async ({ session }) => {
      let { channelId, userId, username, user, timestamp } = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      const gameInfo = await getGameInfo(channelId)
      // 未开始
      if (!gameInfo.isStarted) {
        return await sendMessage(session, `<@${session.userId}>\n游戏还没开始呢~\n开始后再来查询进度吧！`, `改名 开始游戏`)
      }
      // 返回信息
      const {
        correctLetters,
        presentLetters,
        isHardMode,
        gameMode,
        guessWordLength,
        absentLetters,
        isAbsurd,
        isChallengeMode,
        targetWord,
        wordlesNum,
        isUltraHardMode,
        presentLettersWithIndex,
        correctPinyinsWithIndex,
        presentPinyins,
        presentPinyinsWithIndex,
        absentPinyins,
        absentTones,
        presentTonesWithIndex,
        correctTonesWithIndex,
        presentTones
      } = gameInfo;
      const usernameMention = `<@${session.userId}>`;
      const inputLengthMessage = `待猜${gameMode === '宝可兜' || gameMode === '宝可影' ? '名称' : gameMode === 'Numberle' ? '数字' : gameMode === 'Math' ? '数学方程式' : '单词'}的长度为：【${guessWordLength}】`;
      const extraGameInfo = wordlesNum > 1 ? `\n${await processExtraGameInfos(channelId)}` : '';
      const gameDuration = calculateGameDuration(Number(gameInfo.timestamp), timestamp);
      const progressInfo = `当前${gameDuration}\n当前进度：【${correctLetters.join('')}】`;

      const presentInfo = presentLetters.length !== 0 ? `\n包含：【${presentLetters}】` : '';
      const absentInfo = absentLetters.length !== 0 ? `\n不包含：【${absentLetters}】` : '';
      const presentWithIndexInfo = presentLettersWithIndex.length !== 0 ? `\n位置排除：【${presentLettersWithIndex.join(', ')}】` : '';

      const pinyinsCorrectInfo = correctPinyinsWithIndex.length !== 0 ? `\n正确拼音：【${correctPinyinsWithIndex.join(', ')}】` : '';
      const pinyinsPresentInfo = presentPinyins.length !== 0 ? `\n包含拼音：【${presentPinyins.join(', ')}】` : '';
      const pinyinsAbsentInfo = absentPinyins.length !== 0 ? `\n不包含拼音：【${absentPinyins.join(', ')}】` : '';
      const pinyinsPresentWithIndexInfo = presentPinyinsWithIndex.length !== 0 ? `\n拼音位置排除：【${presentPinyinsWithIndex.join(', ')}】` : '';

      const tonesCorrectInfo = correctTonesWithIndex.length !== 0 ? `\n正确声调：【${correctTonesWithIndex.join(', ')}】` : '';
      const tonesPresentInfo = presentTones.length !== 0 ? `\n包含声调：【${presentTones.join(', ')}】` : '';
      const tonesAbsentInfo = absentTones.length !== 0 ? `\n不包含声调：【${absentTones.join(', ')}】` : '';
      const tonesPresentWithIndexInfo = presentTonesWithIndex.length !== 0 ? `\n声调位置排除：【${presentTonesWithIndex.join(', ')}】` : '';


      const progressMessage = `${progressInfo}${presentInfo}${absentInfo}${presentWithIndexInfo}${pinyinsCorrectInfo}${pinyinsPresentInfo}${pinyinsAbsentInfo}${pinyinsPresentWithIndexInfo}${tonesCorrectInfo}${tonesPresentInfo}${tonesAbsentInfo}${tonesPresentWithIndexInfo}${extraGameInfo}`;

      const timeDifferenceInSeconds = (timestamp - Number(gameInfo.timestamp)) / 1000;
      let message = `${usernameMention}\n当前游戏模式为：【${gameMode}${wordlesNum > 1 ? `（x${wordlesNum}）` : ''}${isHardMode ? `（${isUltraHardMode ? '超' : ''}困难）` : ''}${isAbsurd ? `（变态${isChallengeMode ? '挑战' : ''}）` : ''}】${isChallengeMode ? `\n目标单词为：【${targetWord}】` : ''}`;
      if (config.enableWordGuessTimeLimit) {
        message += `\n剩余作答时间：【${timeDifferenceInSeconds}】秒`;
      }
      message += `\n${inputLengthMessage}\n${progressMessage}`;

      return await sendMessage(session, message, `猜测`);

      // .action
    })
  // pyscb* pysc*
  ctx.command('拼音速查表', '查看拼音速查表')
    .action(async ({ session }) => {
      let { channelId, userId, username } = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      let gameInfo: any = await getGameInfo(channelId)

      if (!gameInfo.isStarted || gameInfo.gameMode !== '宝可兜') {
        const imageBuffer = await generateHandlePinyinsImage(defaultPinyinsHtml)
        return sendMessage(session, h.image(imageBuffer, `image/${config.imageType}`), ``);
      }
      const wordlesNum = gameInfo.wordlesNum
      // 生成 html 字符串
      let imageBuffers: Buffer[] = [];
      let imageBuffer: Buffer = Buffer.from('initial value', 'utf-8');
      for (let wordleIndex = 1; wordleIndex < wordlesNum + 1; wordleIndex++) {
        if (wordleIndex > 1) {
          gameInfo = await getGameInfo2(channelId, wordleIndex)
        }
        const { presentPinyins, correctPinyinsWithIndex, absentPinyins } = gameInfo
        const correctPinyins: string[] = removeIndexFromPinyins(correctPinyinsWithIndex);
        if (gameInfo.gameMode === '宝可兜') {
          const $ = load(defaultPinyinsHtml);

          $('div').each((index, element) => {
            const text = $(element).text();
            if (correctPinyins.includes(text)) {
              $(element).attr('class', 'text-ok');
            } else if (presentPinyins.includes(text)) {
              $(element).attr('class', 'text-mis');
            } else if (absentPinyins.includes(text)) {
              $(element).attr('class', 'op30');
            }
          });

          const modifiedHTML = $.html();
          imageBuffer = await generateHandlePinyinsImage(modifiedHTML)
        }
        imageBuffers.push(imageBuffer);
      }
      if (wordlesNum > 1) {
        const htmlImgString = generateImageTags(imageBuffers);
        imageBuffer = await generateWordlesImage(htmlImgString);
      }
      let dimensions = imageSize(imageBuffer)
      const url = await toUrl(ctx, session, imageBuffer)
      const md=`![img#${dimensions.width}px #${dimensions.height}px](${url})`
      await sendMessage(session, md, ``);
    })

  // 结束猜名 s* js*
  ctx.command('结束猜名', '结束游戏')
    .action(async ({ session }) => {
      const [player]: Pokebattle[] = await ctx.database.get('pokebattle', session.userId)
      if (!player) {
        await session.execute('签到')
        return
      }
      let { channelId, userId, username, timestamp } = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      // 游戏状态
      const gameInfo = await getGameInfo(channelId)
      if (!gameInfo.isStarted) {
        return await sendMessage(session, `<@${session.userId}>\n游戏还没开始哦~怎么结束呐？`, `改名 开始游戏`);
      }
      // 玩家记录输
      await updatePlayerRecordsLose(channelId, gameInfo)
      // 结束猜名
      const processedResult: string = gameInfo.wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : '';
      await endGame(channelId)
      const duration = calculateGameDuration(Number(gameInfo.timestamp), timestamp);
      const message = `<@${session.userId}>\n由于您执行了操作：【结束】\n游戏已结束！\n${duration}${gameInfo.isAbsurd ? '' : `\n${generateGameEndMessage(gameInfo)}`}${processedResult}`;
      await sendMessage(session, message, `改名 玩法介绍 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`, 2);
      // .action
    })

  // hs*
  function replaceSymbols(message: string): string {
    let firstLessThan = true;
    let firstGreaterThan = true;
    let result = '';

    for (let i = 0; i < message.length; i++) {
      const char = message[i];

      if (char === '<' && firstLessThan) {
        firstLessThan = false;
        result += char;
      } else if (char === '>' && firstGreaterThan) {
        firstGreaterThan = false;
        result += char;
      } else if (char === '<') {
        result += '[';
      } else if (char === '>') {
        result += ']';
      } else {
        result += char;
      }
    }

    return result;
  }

  async function getSessionUserName(session: any): Promise<string> {
    const [player]: Pokebattle[] = await ctx.database.get('pokebattle', session.userId)
    let sessionUserName = player.name;

    if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
      let userRecord = await ctx.database.get('p_wordle_player_records', { userId: session.userId });

      if (userRecord.length === 0) {
        await ctx.database.create('p_wordle_player_records', {
          userId: session.userId,
          username: sessionUserName,
        });

        userRecord = await ctx.database.get('p_wordle_player_records', { userId: session.userId });
      }
      sessionUserName = player.name;
    }

    return sessionUserName;
  }

  async function generateHandlePinyinsImage(pinyinsHtml: string) {
    const browser = ctx.puppeteer.browser
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({ width: 420, height: 570, deviceScaleFactor: 1 });
    const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
    await page.goto('file://' + filePath);

    const html = `<html lang="en" class="${config.isDarkThemeEnabled ? 'dark' : ''}" style="--vh: 6.04px;">
    <head>
        <meta charset="UTF-8">
        <title>宝可兜 - 汉字 Wordle</title>
        <link rel="stylesheet" href="./assets/宝可兜/handle.css">
    </head>
    <body>
        <div id="app" data-v-app="">
            <main font-sans="" text="center gray-700 dark:gray-300" select-none="" class=""><!---->
                <div fixed="" z-40="" class="bottom-0 left-0 right-0 top-0">
                    <div class="bg-base left-0 right-0 top-0 bottom-0 absolute transition-opacity duration-500 ease-out opacity-50"></div>
                    <div class="bg-base border-base absolute transition-all duration-200 ease-out max-w-screen max-h-screen overflow-auto scrolls top-0 left-0 right-0 border-b"
                         style="">
                        <div p8="" pt4="" flex="~ col center" relative=""><p text-xl="" font-serif="" mb8=""><b>拼音速查表</b></p>
                            <div grid="~ cols-[1fr_3fr] gap-x-10 gap-y-4" font-mono="" font-light="">
                                <div text-center="">声母</div>
                                <div text-center="">韵母</div>
                                    ${pinyinsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </body>
</html>`;

    await page.setContent(html, { waitUntil: 'load' });
    const imageBuffer = await page.screenshot({ fullPage: true, type: config.imageType });
    await page.close();
    await context.close()


    return imageBuffer;
  }

  async function processExtraGameInfos(channelId: string): Promise<string> {
    const extraGameInfos: ExtraGameRecord[] = await ctx.database.get('p_extra_wordle_game_records', { channelId });

    return extraGameInfos
      .map(({
        correctLetters,
        presentLetters,
        absentLetters,
        presentLettersWithIndex,
        presentPinyinsWithIndex,
        correctPinyinsWithIndex,
        correctTonesWithIndex,
        presentTonesWithIndex,
        presentTones,
        absentTones,
        absentPinyins,
        presentPinyins
      }) => {
        const present = presentLetters.length === 0 ? '' : `\n包含：【${presentLetters}】`;
        const absent = absentLetters.length === 0 ? '' : `\n不包含：【${absentLetters}】`;
        const presentWithoutIndex = presentLettersWithIndex.length === 0 ? '' : `\n位置排除：【${presentLettersWithIndex.join(', ')}】`;

        const pinyinsCorrectInfo = correctPinyinsWithIndex.length !== 0 ? `\n正确拼音：【${correctPinyinsWithIndex.join(', ')}】` : '';
        const pinyinsPresentInfo = presentPinyins.length !== 0 ? `\n包含拼音：【${presentPinyins.join(', ')}】` : '';
        const pinyinsAbsentInfo = absentPinyins.length !== 0 ? `\n不包含拼音：【${absentPinyins.join(', ')}】` : '';
        const pinyinsPresentWithIndexInfo = presentPinyinsWithIndex.length !== 0 ? `\n拼音位置排除：【${presentPinyinsWithIndex.join(', ')}】` : '';

        const tonesCorrectInfo = correctTonesWithIndex.length !== 0 ? `\n正确声调：【${correctTonesWithIndex.join(', ')}】` : '';
        const tonesPresentInfo = presentTones.length !== 0 ? `\n包含声调：【${presentTones.join(', ')}】` : '';
        const tonesAbsentInfo = absentTones.length !== 0 ? `\n不包含声调：【${absentTones.join(', ')}】` : '';
        const tonesPresentWithIndexInfo = presentTonesWithIndex.length !== 0 ? `\n声调位置排除：【${presentTonesWithIndex.join(', ')}】` : '';
        return `\n当前进度：【${correctLetters.join('')}】${present}${absent}${presentWithoutIndex}${pinyinsCorrectInfo}${pinyinsPresentInfo}${pinyinsAbsentInfo}${pinyinsPresentWithIndexInfo}${tonesCorrectInfo}${tonesPresentInfo}${tonesAbsentInfo}${tonesPresentWithIndexInfo}`;
      })
      .join('\n');
  }

  async function processExtraGameRecords(channelId: string): Promise<string> {
    const extraGameInfos: ExtraGameRecord[] = await ctx.database.get('p_extra_wordle_game_records', { channelId })

    const resultStrings: string[] = extraGameInfos.map(info => {
      // return `\n答案是：【${info.wordGuess}】${info.pinyin === '' ? '' : `\n拼音为：【${info.pinyin}】`}\n释义如下：\n${info.wordAnswerChineseDefinition}`
      return `\n答案是：【${info.wordGuess}】${info.wordAnswerChineseDefinition !== '' ? `${info.pinyin === '' ? '' : `\n拼音为：【${info.pinyin}】`}\n释义如下：\n${replaceEscapeCharacters(info.wordAnswerChineseDefinition)}` : ''}`;
    })

    return resultStrings.join('\n')
  }

  async function generateWordlesImage(htmlImgString: string,) {
    const browser = ctx.puppeteer.browser
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({
      width: config.compositeImagePageWidth,
      height: config.compositeImagePageHeight,
      deviceScaleFactor: 1
    })
    const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
    await page.goto('file://' + filePath);

    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <style>
            .image-container {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                justify-content: space-between;
                align-items: center;
            }
            .image-container img {
                max-width: 100%;
                /*margin-top: 20px;*/
                /*margin-bottom: 20px;*/
            }
        </style>
        <script>
            window.onload = function() {
                var imageContainer = document.querySelector('.image-container');
                var images = imageContainer.getElementsByTagName('img');

                if (images.length > 4) {
                    for (var i = 0; i < images.length; i++) {
                        images[i].style.width = "calc(25% - 15px)";
                    }
                } else {
                    for (var i = 0; i < images.length; i++) {
                        images[i].style.width = "calc(50% - 10px)";
                    }
                }
            };
        </script>
    </head>
    <body>
    <div class="image-container">
    ${htmlImgString}
    </div>
    </body>
    </html>`;

    await page.setContent(html, { waitUntil: 'load' });
    const wordlesImageBuffer = await page.screenshot({ fullPage: true, type: config.imageType });
    await page.close();
    await context.close()

    return wordlesImageBuffer;
  }

  async function generateLetterTilesHtml(wordGuess: string, inputWord: string, channelId: string, wordleIndex: number, gameInfo: GameRecord | ExtraGameRecord): Promise<string> {
    const wordHtml: string[] = new Array(inputWord.length);
    const letterCountMap: { [key: string]: number } = {};

    const correctLetters: string[] = gameInfo.correctLetters;
    let presentLetters = gameInfo.presentLetters
    let absentLetters = gameInfo.absentLetters
    let presentLettersWithIndex = gameInfo.presentLettersWithIndex


    for (const letter of wordGuess) {
      if (letterCountMap[letter]) {
        letterCountMap[letter]++;
      } else {
        letterCountMap[letter] = 1;
      }
    }

    const lowercaseInputWord = inputWord.toLowerCase();

    // 处理 "correct"
    let htmlIndex = 0;
    for (let i = 0; i < inputWord.length; i++) {
      const letter = lowercaseInputWord[i];
      if (wordGuess[i] === letter) {
        wordHtml[htmlIndex] = `<div><div class="Tile-module_tile__UWEHN" data-state="correct">${letter}</div></div>`;
        letterCountMap[letter]--;

        correctLetters[i] = letter;
      } else {
        wordHtml[htmlIndex] = `<div><div class="Tile-module_tile__UWEHN" data-state="unchecked">${letter}</div></div>`;
      }
      htmlIndex++;
    }

    // 处理其他标记
    htmlIndex = 0;
    for (let i = 0; i < inputWord.length; i++) {
      const letter = lowercaseInputWord[i];
      if (wordHtml[htmlIndex].includes("data-state=\"unchecked\"")) {
        if (wordGuess.includes(letter)) {
          if (letterCountMap[letter] > 0) {
            wordHtml[htmlIndex] = wordHtml[htmlIndex].replace("data-state=\"unchecked\"", "data-state=\"present\"");
            letterCountMap[letter]--;

            presentLetters += letter;
            presentLettersWithIndex.push(`${letter}-${i + 1}`)
          } else {
            wordHtml[htmlIndex] = wordHtml[htmlIndex].replace("data-state=\"unchecked\"", "data-state=\"absent\"");
            absentLetters += letter;
          }
        } else {
          wordHtml[htmlIndex] = wordHtml[htmlIndex].replace("data-state=\"unchecked\"", "data-state=\"absent\"");
          absentLetters += letter;
        }
      }
      htmlIndex++;
    }
    const setWordleGameRecord = async (collection: any, keys: any) => {
      await ctx.database.set(collection, keys, {
        correctLetters,
        presentLetters: uniqueSortedLowercaseLetters(presentLetters),
        absentLetters: removeLetters(gameInfo.wordGuess, uniqueSortedLowercaseLetters(absentLetters)),
        presentLettersWithIndex: mergeDuplicates(presentLettersWithIndex),
      });
    };
    if (wordleIndex === 1) {
      await setWordleGameRecord('p_wordle_game_records', { channelId });
    } else {
      await setWordleGameRecord('p_extra_wordle_game_records', { channelId, wordleIndex });
    }
    return wordHtml.join("\n");
  }

  async function generateLetterTilesHtmlForCiying(answerIdiom: string, userInputIdiom: string, channelId: string, wordleIndex: number, gameInfo: GameRecord | ExtraGameRecord, isHardMode: boolean): Promise<string> {
    const htmlResult: string[] = [`<div class="relative flex items-center">
<div class="grid grid-cols-4 justify-items-center gap-2 svelte-n2hnfv">`];
    const strokesHtmlCache: string[][] = gameInfo.strokesHtmlCache
    const correctLetters: string[] = gameInfo.correctLetters;
    const previousGuess: string[] = gameInfo.previousGuess;
    const previousGuessIdioms: string[] = gameInfo.previousGuessIdioms;
    const defaultModeSettings = {
      keepShadow: !0,
      correctThreshold: .5,
      presentThreshold: 1,
      shiftFactor: .7,
      idiomLimit: 2e3
    }
    const hardModeSettings = {
      keepShadow: !1,
      correctThreshold: .3,
      presentThreshold: 1,
      shiftFactor: .7
    }
    const config = isHardMode ? hardModeSettings : defaultModeSettings
    for (let i = 0; i < answerIdiom.length; i++) {
      const compareReslut = compareStrokes(strokesData[answerIdiom[i]], strokesData[userInputIdiom[i]], null, config)
      compareReslut.match = answerIdiom[i] === userInputIdiom[i]
      if (compareReslut.match || correctLetters[i] !== '*') {
        correctLetters[i] = answerIdiom[i]
        compareReslut.shadows = []
        for (const stroke of strokesData[answerIdiom[i]].strokes) {
          compareReslut.shadows.push({ stroke, shiftX: 0, shiftY: 0, distance: 0 })
        }
        compareReslut.match = true
      }
      htmlResult.push(` <button class="transition-transform betterhover:hover:scale-y-90">
                                <div class="flex h-32 w-32 items-center justify-center border-neutral-400 dark:border-neutral-600 ${compareReslut.match ? 'bg-correct' : 'border-2'}"
                                     style="">
                                    <svg viewBox="0 0 1024 1024" class="h-24 w-24">
                                        <g transform="scale(1, -1) translate(0, -900)">
                                        ${compareReslut.match || previousGuessIdioms.includes(userInputIdiom) || isHardMode ? '' : strokesHtmlCache[i].join('\n')}`)

      // strokesHtmlCache[i].forEach((path, index) => {
      //   const dAttribute = path.match(/d="([^"]*)"/);
      //   if (dAttribute) {
      //     const dValue = dAttribute[1];
      //
      //     compareReslut.shadows = compareReslut.shadows.filter(shadow => shadow.stroke !== dValue);
      //   }
      // });

      for (let shadow of compareReslut.shadows) {
        if (!shadow.stroke) {
          continue
        }

        const theStrokePath = `  <path d="${shadow.stroke}"
                                                  opacity="${(config.presentThreshold - Math.max(shadow.distance, config.correctThreshold)) / (config.presentThreshold - config.correctThreshold)}"
                                                  transform="translate(${shadow.shiftX}, ${shadow.shiftY})"
                                                  class="${compareReslut.match ? 'fill-white' : shadow.distance === 0 ? 'fill-correct' : 'dark:fill-white'}"></path>
                                           `
        htmlResult.push(theStrokePath)
        if (!previousGuess.includes(`${userInputIdiom[i]}-${i}`)) {
          strokesHtmlCache[i].push(theStrokePath)
        }

      }
      htmlResult.push(`</g>
                                    </svg>
                                </div>
                            </button>`)
    }


    htmlResult.push(`</div>
</div>`)
    const userInputIdiomArray = userInputIdiom.split("").map((char, index) => `${char}-${index}`);
    userInputIdiomArray.forEach((charIndex) => {
      if (!previousGuess.includes(charIndex)) {
        previousGuess.push(charIndex);
      }
    });
    if (!previousGuessIdioms.includes(userInputIdiom)) {
      previousGuessIdioms.push(userInputIdiom);
    }
    const setWordleGameRecord = async (collection: any, keys: any) => {
      await ctx.database.set(collection, keys, {
        strokesHtmlCache,
        correctLetters,
        previousGuess,
        previousGuessIdioms,
      });
    };
    if (wordleIndex === 1) {
      await setWordleGameRecord('p_wordle_game_records', { channelId });
    } else {
      await setWordleGameRecord('p_extra_wordle_game_records', { channelId, wordleIndex });
    }
    return htmlResult.join('\n')
  }


  async function generateLetterTilesHtmlForHandle(answerIdiom: string, userInputIdiom: string, channelId: string, wordleIndex: number, gameInfo: GameRecord | ExtraGameRecord, answerPinyin: string, userInputPinyin: string) {
    const correctLetters: string[] = gameInfo.correctLetters;
    let presentLetters = gameInfo.presentLetters
    let absentLetters = gameInfo.absentLetters
    let presentLettersWithIndex = gameInfo.presentLettersWithIndex
    let correctPinyinsWithIndex = gameInfo.correctPinyinsWithIndex
    let presentPinyinsWithIndex = gameInfo.presentPinyinsWithIndex
    let absentPinyins = gameInfo.absentPinyins
    let correctTonesWithIndex = gameInfo.correctTonesWithIndex
    let presentTonesWithIndex = gameInfo.presentTonesWithIndex
    let absentTones = gameInfo.absentTones
    let presentPinyins = gameInfo.presentPinyins
    let presentTones = gameInfo.presentTones

    interface WordInfo {
      word: string;
      pinyin: string[];
    }

    if (!userInputPinyin) {
      const userInputIdiomInfo = await getIdiomInfo(userInputIdiom)
      userInputPinyin = userInputIdiomInfo.pinyin
    }

    // 拼音转换 分离音标 string[][]
    const processedUserInputPinyin = processPinyin(userInputPinyin)
    const processedAnswerIdiomPinyin = processPinyin(answerPinyin)

    // 总信息
    const userInputIdiomAllRecords: WordInfo[] = userInputIdiom.split('').map((char, index) => {
      const pinyinArray = processedUserInputPinyin[index].map(p => {
        const [pinyin, status = ''] = p.split('-');
        return `${pinyin}-absent${status ? `-${status}-absent` : ''}`;
      });
      return { word: `${char}-absent`, pinyin: pinyinArray };
    });


    // 汉字统计
    const userInputIdiomCharCount = countCharactersAndIndexes(userInputIdiom);
    const answerIdiomCharCount = countCharactersAndIndexes(answerIdiom);
    // 声母、韵母、整体认读音节统计
    const userInputPinyinOccurrences = processPinyinArray(processedUserInputPinyin);
    const answerIdiomPinyinOccurrences = processPinyinArray(processedAnswerIdiomPinyin);

    const userInputPinyinAllOccurrences = mergeOccurrences(userInputPinyinOccurrences);
    const answerIdiomPinyinAllOccurrences = mergeOccurrences(answerIdiomPinyinOccurrences);
    // 声调统计
    const userInputTones = countNumericTones(processedUserInputPinyin);
    const answerIdiomTones = countNumericTones(processedAnswerIdiomPinyin);
    const answerIdiomTonesCopy = answerIdiomTones

    for (const char in userInputIdiomCharCount) {
      if (char in answerIdiomCharCount) {
        const userInputCharInfo = userInputIdiomCharCount[char];
        const answerCharInfo = answerIdiomCharCount[char];

        const commonIndexes = userInputCharInfo.indexes.filter(index => answerCharInfo.indexes.includes(index));

        commonIndexes.forEach(index => {
          // correct
          // userInputIdiomAllRecords[index].pinyin = userInputIdiomAllRecords[index].pinyin.map(pinyin => pinyin.replace(/-\w+$/g, '-correct'));
          userInputIdiomAllRecords[index].word = userInputIdiomAllRecords[index].word.replace(/-\w+$/g, '-correct');
          correctLetters[index] = userInputIdiomAllRecords[index].word.split('-')[0]
          // updateOccurrences(answerIdiomPinyinAllOccurrences, index);
          // updateOccurrences(userInputPinyinAllOccurrences, index);
          // updateOccurrences(userInputTones, index);
          // updateOccurrences(answerIdiomTones, index);

          userInputCharInfo.count -= 1;
          userInputCharInfo.indexes = userInputCharInfo.indexes.filter(i => i !== index);

          answerCharInfo.count -= 1;
          answerCharInfo.indexes = answerCharInfo.indexes.filter(i => i !== index);
        });

        userInputCharInfo.indexes.forEach(userIndex => {
          if (!answerCharInfo.indexes.includes(userIndex) && answerCharInfo.count > 0) {
            // present
            userInputIdiomAllRecords[userIndex].word = userInputIdiomAllRecords[userIndex].word.replace(/-\w+$/g, '-present');

            presentLetters += userInputIdiomAllRecords[userIndex].word.split('-')[0]
            presentLettersWithIndex.push(`${userInputIdiomAllRecords[userIndex].word.split('-')[0]}-${userIndex + 1}`)
            answerCharInfo.count -= 1;
          }
        });
      } else {
        // absent
        absentLetters += char
      }
    }

    for (const element in userInputPinyinAllOccurrences) {
      if (element in answerIdiomPinyinAllOccurrences) {
        const userInputElementInfo = userInputPinyinAllOccurrences[element];
        const answerElementInfo = answerIdiomPinyinAllOccurrences[element];

        const commonPositions = userInputElementInfo.positions.filter(position => answerElementInfo.positions.includes(position));

        commonPositions.forEach(position => {
          // correct
          const pinyinArray = userInputIdiomAllRecords[position].pinyin.map(pinyin => {
            return pinyin.split('-')[0]
          }).join('')

          const matchIndex = pinyinArray.indexOf(element)
          if (matchIndex !== -1) {
            for (let i = matchIndex; i < matchIndex + element.length; i++) {
              userInputIdiomAllRecords[position].pinyin[i] = userInputIdiomAllRecords[position].pinyin[i].replace('absent', 'correct')
            }
          }

          correctPinyinsWithIndex.push(`${element}-${position + 1}`)

          userInputElementInfo.count -= 1;
          userInputElementInfo.positions = userInputElementInfo.positions.filter(i => i !== position);

          answerElementInfo.count -= 1;
          answerElementInfo.positions = answerElementInfo.positions.filter(i => i !== position);
        });

        userInputElementInfo.positions.forEach(userPosition => {
          if (!answerElementInfo.positions.includes(userPosition) && answerElementInfo.count > 0) {
            // present
            const pinyinArray = userInputIdiomAllRecords[userPosition].pinyin.map(pinyin => {
              return pinyin.split('-')[0]
            }).join('')

            const matchIndex = pinyinArray.indexOf(element)
            if (matchIndex !== -1) {
              for (let i = matchIndex; i < matchIndex + element.length; i++) {
                userInputIdiomAllRecords[userPosition].pinyin[i] = userInputIdiomAllRecords[userPosition].pinyin[i].replace('absent', 'present')
              }
            }
            presentPinyins.push(element)
            presentPinyinsWithIndex.push(`${element}-${userPosition + 1}`)
            answerElementInfo.count -= 1;
          }
        });
      } else {
        absentPinyins.push(element)
      }
    }


    for (const tone in userInputTones) {
      if (tone in answerIdiomTones) {
        // correct
        const userInputToneInfo = userInputTones[tone];
        const answerToneInfo = answerIdiomTones[tone];

        const commonPositions = userInputToneInfo.positions.filter(position => answerToneInfo.positions.includes(position));

        commonPositions.forEach(position => {
          const matchIndex = userInputIdiomAllRecords[position].pinyin.findIndex(pinyin => pinyin.includes(`-${tone}-absent`));
          if (matchIndex !== -1) {
            userInputIdiomAllRecords[position].pinyin[matchIndex] = userInputIdiomAllRecords[position].pinyin[matchIndex].replace(`-${tone}-absent`, `-${tone}-correct`);
          }
          correctTonesWithIndex.push(`第${tone}声-${position + 1}`)
          userInputToneInfo.count -= 1;
          userInputToneInfo.positions = userInputToneInfo.positions.filter(i => i !== position);

          answerToneInfo.count -= 1;
          answerToneInfo.positions = answerToneInfo.positions.filter(i => i !== position);
        });

        userInputToneInfo.positions.forEach(userPosition => {
          if (!answerToneInfo.positions.includes(userPosition) && answerToneInfo.count > 0) {
            // present
            const pinyinArray = userInputIdiomAllRecords[userPosition].pinyin;
            const matchIndex = pinyinArray.findIndex(pinyin => pinyin.includes(`-${tone}-absent`));
            if (matchIndex !== -1) {
              userInputIdiomAllRecords[userPosition].pinyin[matchIndex] = pinyinArray[matchIndex].replace(`-${tone}-absent`, `-${tone}-present`);
            }
            presentTones.push(`第${tone}声`)
            presentTonesWithIndex.push(`第${tone}声-${userPosition + 1}`)
            answerToneInfo.count -= 1;
          }
        });
      } else {
        absentTones.push(`第${tone}声`)
      }
    }

    const processedRecords = processAllRecords(userInputIdiomAllRecords);

    const processedRecords2 = transformRecords(processedRecords)

    const htmlResult: string[] = [`<div flex="">`]
    for (const record of processedRecords2) {
      const wordValue = record.word.value
      const statusMap: { [key: string]: string } = {
        'absent': 'op80',
        'present': 'text-mis',
        'correct': 'text-ok'
      };

      let wordStatus = record.word.status;
      wordStatus = statusMap[wordStatus] || wordStatus;

      const statusMap2: { [key: string]: string } = {
        'absent': 'op35',
        'present': 'text-mis',
        'correct': 'text-ok'
      };
      const pinyin = record.pinyin
      const separatedPinyin = separatePinyin(record);
      const initial = record.initial
      const final = record.final
      const toneValue = record.tune.value
      const toneStatus = record.tune.status
      const tonesPaths = [
        '0',
        // 第 1 声
        '<path d="M3.35 8C2.60442 8 2 8.60442 2 9.35V10.35C2 11.0956 2.60442 11.7 3.35 11.7H17.35C18.0956 11.7 18.7 11.0956 18.7 10.35V9.35C18.7 8.60442 18.0956 8 17.35 8H3.35Z" fill="currentColor"></path>',
        // 第 2 声
        '<path d="M16.581 3.71105C16.2453 3.27254 15.6176 3.18923 15.1791 3.52498L3.26924 12.6439C2.83073 12.9796 2.74743 13.6073 3.08318 14.0458L4.29903 15.6338C4.63478 16.0723 5.26244 16.1556 5.70095 15.8199L17.6108 6.70095C18.0493 6.3652 18.1327 5.73754 17.7969 5.29903L16.581 3.71105Z" fill="currentColor"></path>',
        // 第 3 声
        '<path d="M1.70711 7.70712C1.31658 7.3166 1.31658 6.68343 1.70711 6.29291L2.41421 5.5858C2.80474 5.19528 3.4379 5.19528 3.82843 5.5858L9.31502 11.0724C9.70555 11.4629 10.3387 11.4629 10.7292 11.0724L16.2158 5.5858C16.6064 5.19528 17.2395 5.19528 17.63 5.5858L18.3372 6.29291C18.7277 6.68343 18.7277 7.3166 18.3372 7.70712L10.7292 15.315C10.3387 15.7056 9.70555 15.7056 9.31502 15.315L1.70711 7.70712Z" fill="currentColor"></path>',
        // 第 4 声
        '<path d="M4.12282 3.71105C4.45857 3.27254 5.08623 3.18923 5.52474 3.52498L17.4346 12.6439C17.8731 12.9796 17.9564 13.6073 17.6207 14.0458L16.4048 15.6338C16.0691 16.0723 15.4414 16.1556 15.0029 15.8199L3.09303 6.70095C2.65452 6.3652 2.57122 5.73754 2.90697 5.29903L4.12282 3.71105Z" fill="currentColor"></path>'
      ];
      const html: string[] = [`<div w-30="" h-30="" m2="">
                    <div h-30="" w-30="" border-2="" flex="~ center" relative="" leading-1em="" em="" font-serif=""
                         class="bg-gray-400/8 border-transparent">
                        <div absolute="" text-5xl="" leading-1em="" class="${wordStatus} top-12">${wordValue}</div>
                        <div absolute="" font-mono="" text-center="" left-0="" right-0="" font-100="" flex=""
                             flex-col="" items-center="" class="top-14px" text-2xl="">
                            <div relative="" ma="" items-start="" flex="~ x-center">
                                ${separatedPinyin.initials.length > 0 ? `<div class="${statusMap2[separatedPinyin.initials[0].status]}" mx-1px="">${initial}</div>` : ''}
<div mx-1px="" flex="">`]
      for (const final of separatedPinyin.finals) {
        if (!final.isHasTone) {
          html.push(`<div class="${statusMap2[final.status]}">${final.value}</div>`)
        } else {
          html.push(`                  <div relative="">
                                        <div class="${statusMap2[final.status]}">${final.value === 'i' ? 'ı' : final.value}</div>
                                        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
                                             class="${statusMap2[toneStatus]}" absolute="" w="86%" left="8%"
                                             style="bottom: 1.5rem;">
                                            ${tonesPaths[toneValue]}
                                        </svg>
                                    </div>`)
        }
      }
      html.push(`</div>
                            </div>
                        </div>
                    </div>
                </div>`)
      htmlResult.push(html.join('\n'))
    }
    htmlResult.push(`</div>`)

    const pinyinSet = new Set(Object.keys(answerIdiomPinyinOccurrences.initialsOccurrences)
      .concat(Object.keys(answerIdiomPinyinOccurrences.finalsOccurrences)));

    const filteredAbsentPinyins = absentPinyins.filter(pinyin => !pinyinSet.has(pinyin));
    absentTones.forEach((tone, index) => {
      const toneNumber = tone.match(/\d+/);
      if (toneNumber) {
        const key = toneNumber[0];
        if (answerIdiomTonesCopy[key]) {
          absentTones.splice(index, 1);
        }
      }
    });
    const setWordleGameRecord = async (collection: any, keys: any) => {
      await ctx.database.set(collection, keys, {
        correctLetters,
        presentLetters: removeDuplicates(presentLetters),
        absentLetters: removeLetters(gameInfo.wordGuess, removeDuplicates(absentLetters)),
        presentLettersWithIndex: mergeDuplicates(presentLettersWithIndex),
        correctPinyinsWithIndex: mergeDuplicates(correctPinyinsWithIndex),
        presentPinyinsWithIndex: mergeDuplicates(presentPinyinsWithIndex),
        correctTonesWithIndex: mergeDuplicates(correctTonesWithIndex),
        presentTonesWithIndex: mergeDuplicates(presentTonesWithIndex),
        presentPinyins: mergeDuplicates(presentPinyins),
        presentTones: mergeDuplicates(presentTones),
        absentPinyins: mergeDuplicates(filteredAbsentPinyins),
        absentTones: mergeDuplicates(absentTones),
      });
    };
    if (wordleIndex === 1) {
      await setWordleGameRecord('p_wordle_game_records', { channelId });
    } else {
      await setWordleGameRecord('p_extra_wordle_game_records', { channelId, wordleIndex });
    }

    return htmlResult.join('\n')

  }


  async function setGuessRunningStatus(channelId: string, isRunning: boolean): Promise<void> {
    await ctx.database.set('p_wordle_game_records', { channelId }, { isRunning });
  }

  async function endGame(channelId: string) {
    await Promise.all([
      ctx.database.remove('p_wordle_gaming_player_records', { channelId }),
      ctx.database.remove('p_wordle_game_records', { channelId }),
      ctx.database.remove('p_extra_wordle_game_records', { channelId }),
      await setGuessRunningStatus(channelId, false),
    ]);
  }

  async function updatePlayerRecordsLose(channelId: string, gameInfo: GameRecord) {
    const gamingPlayers: GamingPlayer[] = await ctx.database.get('p_wordle_gaming_player_records', { channelId });

    for (const player of gamingPlayers) {
      const gameMode = gameInfo.gameMode;
      const [playerInfo] = await ctx.database.get('p_wordle_player_records', { userId: player.userId });
      if (!playerInfo || !playerInfo.stats.hasOwnProperty(gameMode)) {
        continue;
      }
      const updatedLose = playerInfo.lose + 1;
      playerInfo.stats[gameMode].lose += 1;

      if (gameInfo.gameMode === '宝可影') {
        if (gameInfo.wordlesNum === 1) {
          if (gameInfo.isHardMode) {
            playerInfo.extraCiyingRankInfo.loseIn1HardMode += 1;
          } else {
            playerInfo.extraCiyingRankInfo.loseIn1Mode += 1;
          }
        } else if (gameInfo.wordlesNum >= 2 && gameInfo.wordlesNum <= 4) {
          const extraCiyingRankInfoKey = `loseIn${gameInfo.wordlesNum}Mode`;
          playerInfo.extraCiyingRankInfo[extraCiyingRankInfoKey] += 1;
        }
      }

      const updateData = {
        stats: playerInfo.stats,
        lose: updatedLose
      };

      if (gameInfo.gameMode === '宝可影') {
        updateData['extraCiyingRankInfo'] = playerInfo.extraCiyingRankInfo;
      }

      await ctx.database.set('p_wordle_player_records', { userId: player.userId }, updateData);
    }
  }


  async function updatePlayerRecordsWin(channelId: string, gameInfo: GameRecord) {
    const gamingPlayers: GamingPlayer[] = await ctx.database.get('p_wordle_gaming_player_records', { channelId });

    for (const player of gamingPlayers) {
      const gameMode = gameInfo.gameMode;
      const [playerInfo] = await ctx.database.get('p_wordle_player_records', { userId: player.userId });
      if (!playerInfo || !playerInfo.stats.hasOwnProperty(gameMode)) {
        continue;
      }
      const updatedWin = playerInfo.win + 1;
      playerInfo.stats[gameMode].win += 1;

      if (gameInfo.gameMode === '宝可影') {
        if (gameInfo.wordlesNum === 1) {
          if (gameInfo.isHardMode) {
            playerInfo.extraCiyingRankInfo.winIn1HardMode += 1;
          } else {
            playerInfo.extraCiyingRankInfo.winIn1Mode += 1;
          }
        } else if (gameInfo.wordlesNum >= 2 && gameInfo.wordlesNum <= 4) {
          const extraCiyingRankInfoKey = `winIn${gameInfo.wordlesNum}Mode`;
          playerInfo.extraCiyingRankInfo[extraCiyingRankInfoKey] += 1;
        }
      }

      const updateData = {
        stats: playerInfo.stats,
        win: updatedWin
      };

      if (gameInfo.gameMode === '宝可影') {
        updateData['extraCiyingRankInfo'] = playerInfo.extraCiyingRankInfo;
      }

      await ctx.database.set('p_wordle_player_records', { userId: player.userId }, updateData);
    }
  }

  async function generateImageForCiying(gridHtml: string, rowNum: number): Promise<Buffer> {
    const browser = ctx.puppeteer.browser
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({ width: 688, height: 140 * rowNum, deviceScaleFactor: 1 })
    const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
    await page.goto('file://' + filePath);

    const html = `<html lang="zh" class="h-full ${config.isDarkThemeEnabled ? 'dark' : ''}">
<head>
    <meta charset="UTF-8">
    <title>宝可影</title>
    <link rel="stylesheet" href="./assets/宝可影/ciying.css">
        <style>
        .container {
            padding-top: 10px;
            padding-bottom: 10px;
        }
    </style>
</head>

<body class="h-full overflow-y-hidden dark:bg-neutral-900 dark:text-white">
<div class="container">

<div class="flex h-full w-full flex-col">

    <div class="relative flex flex-grow flex-col overflow-y-auto overflow-x-hidden">
        <div class="flex h-full items-center justify-center overflow-y-auto">
            <div class="max-h-full">
                <div class="grid grid-rows-5 gap-2 py-2">
${gridHtml}
                </div>
            </div>
        </div>
    </div>
</div>
</div>

</body>
</html>`;


    await page.setContent(html, { waitUntil: 'load' });
    const imageBuffer = await page.screenshot({ fullPage: true, type: config.imageType });
    await page.close();
    await context.close()

    return imageBuffer;
  }

  async function generateImageForHandle(gridHtml: string): Promise<Buffer> {
    const browser = ctx.puppeteer.browser
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({ width: 688, height: 731, deviceScaleFactor: 1 })
    const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
    await page.goto('file://' + filePath);

    const html = `<html lang="en" class="${config.isDarkThemeEnabled ? 'dark' : ''}" style="--vh: 7.55px;">
<head>
    <meta charset="UTF-8">
    <title>宝可兜 - 汉字 Wordle</title>
    <link rel="stylesheet" href="./assets/宝可兜/handle.css">
    <style>
        .container {
            padding-top: 30px;
            padding-bottom: 30px;
        }
    </style>
</head>
<body>
<div class="container">
    <main font-sans="" text="center gray-700 dark:gray-300" select-none="" class="${config.isHighContrastThemeEnabled ? 'colorblind' : ''}">
        <div flex="~ col" items-center="">
           ${gridHtml}
        </div>
    </main>
</div>
</body>
</html>`;


    await page.setContent(html, { waitUntil: 'load' });
    const imageBuffer = await page.screenshot({ fullPage: true, type: config.imageType });
    await page.close();
    await context.close();

    return imageBuffer;
  }

  async function isPlayerInGame(channelId: string, userId: string): Promise<boolean> {
    const getPlayer = await ctx.database.get('p_wordle_gaming_player_records', { channelId, userId });
    return getPlayer.length !== 0;
  }

  async function getGameInfo(channelId: string): Promise<GameRecord> {
    let gameRecord = await ctx.database.get('p_wordle_game_records', { channelId });
    if (gameRecord.length === 0) {
      await ctx.database.create('p_wordle_game_records', {
        channelId,
        isStarted: false,
      });
      gameRecord = await ctx.database.get('p_wordle_game_records', { channelId });
    }
    return gameRecord[0];
  }

  async function getGameInfo2(channelId: string, wordleIndex: number): Promise<ExtraGameRecord> {
    const gameRecord = await ctx.database.get('p_extra_wordle_game_records', { channelId, wordleIndex });
    return gameRecord[0];
  }

  async function updateNameInPlayerRecord(session, userId: string, username: string): Promise<void> {
    const userRecord = await ctx.database.get('p_wordle_player_records', { userId });

    let isChange = false;

    if (userRecord.length === 0) {
      await ctx.database.create('p_wordle_player_records', {
        userId,
        username,
      });
      return;
    }

    const existingRecord = userRecord[0];

    if (username !== existingRecord.username && !(isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq')) {
      existingRecord.username = username;
      isChange = true;
    }

    const keys = ['Lewdle', '宝可兜', 'Numberle', 'Math', '宝可影'];

    keys.forEach((key) => {
      if (!existingRecord.stats[key] || !existingRecord.stats.hasOwnProperty(key)) {
        existingRecord.stats[key] = { win: 0, lose: 0 };
        isChange = true;
      }
      if (!existingRecord.fastestGuessTime[key]) {
        existingRecord.fastestGuessTime[key] = 0;
        isChange = true;
      }
    });

    if (isChange) {
      await ctx.database.set('p_wordle_player_records', { userId }, {
        username: existingRecord.username,
        stats: existingRecord.stats,
        fastestGuessTime: existingRecord.fastestGuessTime
      });
    }
  }

  let sentMessages = [];
  const msgSeqMap: { [msgId: string]: number } = {};

  async function sendMessage(session: any, message: any, markdownCommands: string, numberOfMessageButtonsPerRow?: number, isButton?: boolean): Promise<void> {
    isButton = isButton || false;
    numberOfMessageButtonsPerRow = numberOfMessageButtonsPerRow || config.numberOfMessageButtonsPerRow;
    const { bot, channelId } = session;
    let messageId;
    let isPushMessageId = false;
    if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
      const msgSeq = msgSeqMap[session.messageId] || 10;
      msgSeqMap[session.messageId] = msgSeq + 100;
      const buttons = await createButtons(session, markdownCommands);

      const rows = [];
      let row = { buttons: [] };
      buttons.forEach((button, index) => {
        row.buttons.push(button);
        if (row.buttons.length === 5 || index === buttons.length - 1 || row.buttons.length === numberOfMessageButtonsPerRow) {
          rows.push(row);
          row = { buttons: [] };
        }
      });
      const kb = {
        keyboard: {
          content: {
            rows: rows.slice(0, 5),
          },
        }
      }
      const result = await await sendMarkdown(ctx,message, session, kb)

      messageId = result.id;


    } else {
      [messageId] = await session.send(message);
    }


    if (config.retractDelay === 0) return;
    if (!isPushMessageId) {
      sentMessages.push(messageId);
    }

    if (sentMessages.length > 1) {
      const oldestMessageId = sentMessages.shift();
      setTimeout(async () => {
        await bot.deleteMessage(channelId, oldestMessageId);
      }, config.retractDelay * 1000);
    }
  }

  interface ChatCompletion {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    system_fingerprint: string;
  }

  interface Choice {
    index: number;
    message: {
      role: string;
      content: string;
    };
    logprobs: any;
    finish_reason: string;
  }

  async function sendPostRequestForGPT1106(content: string): Promise<string> {
    const url = 'https://ngedlktfticp.cloud.sealos.io/v1/chat/completions';
    const headers = {
      'Authorization': 'sk-0HXyYeM287tS1qsI8bAb5f0c3dB746E9A3Bf416dBf99228d',
      'Content-Type': 'application/json'
    };

    const requestBody = {
      "messages": [
        {
          "role": "user",
          "content": `# 汉语拼音生成器
- 提供一个四个汉字的词语，期望输出对应的正确的汉语拼音。
- 只输出汉语拼音，不包含其他无关内容。

示例输入:
戒奢宁俭

期望输出:
jiè shē nìng jiǎn

输入：
${content}

输出：`
        }
      ],
      "stream": false,
      "model": "gpt-3.5-turbo-0125",
      "temperature": 0.5,
      "presence_penalty": 2
    };

    const requestOptions = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    };

    try {
      const response = await fetch(url, requestOptions);
      if (response.ok) {
        const data = await response.json() as ChatCompletion;
        return data.choices[0].message.content
      } else {
        logger.error('未能提取数据:', response.status);
        return ''
      }
    } catch (error) {
      logger.error('读取数据时出错：', error);
      return ''
    }
  }

  function parseMarkdownCommands(markdownCommands: string): string[] {
    return markdownCommands.split(' ').filter(command => command.trim() !== '');
  }

  async function createButtons(session: any, markdownCommands: string) {
    const commands = parseMarkdownCommands(markdownCommands);

    const mapCommandToDataValue = (command: string) => {
      const commandMappings: Record<string, string> = {
        '加入游戏': '加入',
        '开始游戏': '开始猜名',
        '查询玩家记录': '查询玩家记录',
        '猜测': '猜',
        '随机猜测': '猜 -r',
        '输入': '',
        '排行榜': '排行榜',
        '玩法介绍': '玩法介绍',
        '退出游戏': '退出',
        '查单词': '查单词',
        '查成语': '查成语',
        '单词查找器': '单词查找器',
        '查询进度': '查询进度',
        '拼音速查表': '拼音速查表',
        '结束游戏': '结束猜名',
        '再来一把': '开始猜名',
        '再来一把宝可兜': '宝可兜',
        '再来一把宝可影': '宝可影',
        '？？未知图腾': '未知图腾',
      };

      return commandMappings[command];
    };

    const createButton = async (command: string) => {
      let dataValue = mapCommandToDataValue(command);
      if (dataValue === undefined) {
        dataValue = command
      }

      return {
        render_data: {
          label: command,
          visited_label: command,
          style: 1,
        },
        action: {
          type: 2,
          permission: { type: 2 },
          data: `${dataValue}`,
          enter: !['加入游戏', '猜测', '查询玩家记录', '改名', '输入', '困难', '超困难', '变态', '变态挑战', 'x1', 'x2', 'x3', 'x4', '自由'].includes(command),
        },
      };
    };

    const buttonPromises = commands.map(createButton);
    return Promise.all(buttonPromises);
  }

  function checkStrokesData(inputWord: string): boolean {
    for (const char of inputWord) {
      if (!strokesData[char]) {
        return false;
      }
    }
    return true;
  }

  async function getSelectedIdiom(randomIdiom) {
    let selectedIdiom = undefined;

    if (isIdiomInList(randomIdiom, idiomsList)) {
      const foundIdiom = idiomsList.find((item) => item.idiom === randomIdiom);
      if (foundIdiom) {
        selectedIdiom = foundIdiom;
      }
    } else {
      selectedIdiom = await getIdiomInfo(randomIdiom);
    }

    return selectedIdiom;
  }

  function removeIndexFromPinyins(pinyinsWithIndex: string[]): string[] {
    return pinyinsWithIndex.map((item) => {
      return item.split('-')[0];
    });
  }

  async function updateDataInTargetFile(newFilePath: string, targetFilePath: string, missingProperty: string): Promise<void> {
    try {
      const [newData, targetData] = await Promise.all([readJSONFile(newFilePath), readJSONFile(targetFilePath)]);

      const targetDataMap = new Map(targetData.map((item: any) => [item[missingProperty], item]));

      const missingData = newData.filter((dataItem: any) => !targetDataMap.has(dataItem[missingProperty]));

      targetData.push(...missingData);
      await writeJSONFile(targetFilePath, targetData);

      if (missingData.length > 0) {
        logger.success('添加的对象：', missingData);
      }
    } catch (error) {
      logger.error('发生错误：', error);
    }
  }


  async function writeJSONFile(filePath: string, data: any) {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf-8');
  }

  async function readJSONFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  }

  async function ensureFileExists(filePath: string) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
    }
  }

  async function ensureDirExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  function removeDuplicates(inputString: string): string {
    let result = '';
    for (let i = 0; i < inputString.length; i++) {
      if (result.indexOf(inputString[i]) === -1) {
        result += inputString[i];
      }
    }
    return result;
  }

  function mergeDuplicates(arr: string[]): string[] {
    const uniqueArr = arr.reduce((acc: string[], current: string) => {
      if (!acc.includes(current)) {
        acc.push(current);
      }
      return acc;
    }, []);
    return uniqueArr;
  }

  function findIdiomByIdiom(inputWord: string, idiomsList: Idiom[]): Idiom | undefined {
    return idiomsList.find((idiom) => idiom.idiom === inputWord);
  }

  function isIdiomInList(inputWord: string, idiomsList: Idiom[]): boolean {
    return idiomsList.some((idiom) => idiom.idiom === inputWord);
  }

  interface Idiom {
    idiom: string;
    pinyin: string;
    explanation: string;
  }

  function getRandomIdiom(idiomsList: Idiom[]): Idiom {
    const randomIndex: number = Math.floor(Math.random() * idiomsList.length);
    return idiomsList[randomIndex];
  }

  interface PinyinItem {
    value: string;
    status: 'absent' | 'present' | 'correct';
    isHasTone: boolean;
  }

  interface SeparatedPinyin {
    initials: PinyinItem[];
    finals: PinyinItem[];
  }

  function separatePinyin(record): SeparatedPinyin {
    const { initial, final, pinyin } = record;

    const initials: PinyinItem[] = [];
    const finals: PinyinItem[] = [];

    for (let i = 0; i < initial.length; i++) {
      const pinyinItem = pinyin[i];
      if (pinyinItem) {
        initials.push(pinyinItem);
      }
    }

    for (let i = initial.length; i < pinyin.length; i++) {
      const pinyinItem = pinyin[i];
      if (pinyinItem) {
        finals.push(pinyinItem);
      }
    }

    return { initials, finals };
  }

  function transformRecords(records: {
    word: string;
    pinyin: string[];
    initial: string;
    final: string;
  }[]): {
    word: { value: string; status: string };
    pinyin: { value: string; status: string; isHasTone: boolean }[];
    tune: { value: number; status: string };
    initial: string;
    final: string;
  }[] {
    return records.map(record => {
      // 处理 word
      const word = record.word.split('-')[0];
      const status = record.word.split('-')[1];

      let tuneValue: number = 0;
      let tuneStatus = '';
      // 处理 pinyin
      const pinyin = record.pinyin.map(p => {
        let value = p.split('-')[0];
        const status = p.split('-')[1];
        const isHasTone = !!p.split('-')[2]; // 是否有数字声调
        if (isHasTone) {
          tuneValue = parseInt(p.split('-')[2], 10);
          tuneStatus = p.split('-')[3];
        }
        return { value, status, isHasTone };
      });

      return {
        word: { value: word, status },
        pinyin,
        tune: { value: tuneValue, status: tuneStatus },
        initial: record.initial,
        final: record.final,
      };
    });
  }

  function mergeOccurrences(occurrences: any) {
    const { wholeSyllableRecognitionOccurrences, initialsOccurrences, finalsOccurrences, ...rest } = occurrences;
    const mergedOccurrences = {
      ...wholeSyllableRecognitionOccurrences,
      ...initialsOccurrences,
      ...finalsOccurrences
    };
    return {
      ...mergedOccurrences,
      ...rest
    };
  }

  function countNumericTones(processedPinyin: string[][]) {
    const toneCounts: { [key: number]: { count: number, positions: number[] } } = {};

    processedPinyin.forEach((pinyin, index) => {
      pinyin.forEach((syllable, syllableIndex) => {
        const numericToneMatch = syllable.match(/-(\d)/);
        if (numericToneMatch) {
          const tone = parseInt(numericToneMatch[1]);
          if (toneCounts[tone]) {
            toneCounts[tone].count++;
            toneCounts[tone].positions.push(index);
          } else {
            toneCounts[tone] = { count: 1, positions: [index] };
          }
        }
      });
    });

    return toneCounts;
  }

  function processPinyin2(pinyinArray: string[]): string {
    return pinyinArray.map(pinyin => pinyin.replace(/-\d/g, "")).join("")
  }

  function processPinyin3(pinyin: string): string {
    // 在这里实现处理拼音的逻辑，将状态和数字声调去掉
    return pinyin.replace(/-\w+/g, '').replace(/\d/g, '');
  }

  interface ProcessedRecord {
    word: string;
    pinyin: string[];
    initial: string;
    final: string;
  }

  // 韵母
  const finals = ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ui', 'ao', 'ou', 'er', 'ia', 'ie', 'ua', 'uo', 'üe', 'ue', 'iao', 'iou', 'uai', 'uei', 'an', 'ian', 'uan', 'üan', 'en', 'in', 'uen', 'ün', 'un', 'ang', 'iang', 'uang', 'eng', 'ing', 'ueng', 'ong', 'iong'];

  function processAllRecords(userInputIdiomAllRecords: { word: string, pinyin: string[] }[]): ProcessedRecord[] {
    const processedRecords: ProcessedRecord[] = userInputIdiomAllRecords.map(record => {
      const processedPinyinStrings = record.pinyin.map(processPinyin3);
      let initial = '';
      let final = '';
      for (let i = finals.length - 1; i >= 0; i--) {
        const potentialFinal = finals[i];
        const combinedPinyin = processedPinyinStrings.join('');
        if (combinedPinyin.endsWith(potentialFinal)) {
          final = potentialFinal;
          initial = combinedPinyin.slice(0, combinedPinyin.length - potentialFinal.length);
          break;
        }
      }
      return {
        word: record.word,
        pinyin: record.pinyin,
        initial,
        final
      };
    });

    return processedRecords;
  }

  function processPinyinArray(pinyinArray: string[][]): {
    wholeSyllableRecognitionOccurrences: { [key: string]: { count: number, positions: number[] } },
    initialsOccurrences: { [key: string]: { count: number, positions: number[] } },
    finalsOccurrences: { [key: string]: { count: number, positions: number[] } }
  } {
    const processedPinyinStrings = pinyinArray.map(processPinyin2);
    const wholeSyllableRecognitionOccurrences: { [key: string]: { count: number, positions: number[] } } = {};
    const initialsOccurrences: { [key: string]: { count: number, positions: number[] } } = {};
    const finalsOccurrences: { [key: string]: { count: number, positions: number[] } } = {};

    processedPinyinStrings.forEach((pinyin, index) => {
      // if (isWholeSyllableRecognition(pinyin) && false) {
      //   if (wholeSyllableRecognitionOccurrences[pinyin]) {
      //     wholeSyllableRecognitionOccurrences[pinyin].count++;
      //     wholeSyllableRecognitionOccurrences[pinyin].positions.push(index);
      //   } else {
      //     wholeSyllableRecognitionOccurrences[pinyin] = {count: 1, positions: [index]};
      //   }
      // } else {
      let initial = '';
      let final = '';
      for (let i = finals.length - 1; i >= 0; i--) {
        const potentialFinal = finals[i];
        if (pinyin.endsWith(potentialFinal)) {
          final = potentialFinal;
          initial = pinyin.slice(0, -potentialFinal.length);
          break;
        }
      }
      if (initial) {
        if (initialsOccurrences[initial]) {
          initialsOccurrences[initial].count++;
          initialsOccurrences[initial].positions.push(index);
        } else {
          initialsOccurrences[initial] = { count: 1, positions: [index] };
        }
      }
      if (final) {
        if (finalsOccurrences[final]) {
          finalsOccurrences[final].count++;
          finalsOccurrences[final].positions.push(index);
        } else {
          finalsOccurrences[final] = { count: 1, positions: [index] };
        }
      }
      // }
    });

    return {
      wholeSyllableRecognitionOccurrences,
      initialsOccurrences,
      finalsOccurrences
    };
  }

  function countCharactersAndIndexes(idiom: string): { [key: string]: { count: number, indexes: number[] } } {
    const charCount: { [key: string]: { count: number, indexes: number[] } } = {};
    for (let i = 0; i < idiom.length; i++) {
      const char = idiom[i];
      if (charCount[char]) {
        charCount[char].count++;
        charCount[char].indexes.push(i);
      } else {
        charCount[char] = { count: 1, indexes: [i] };
      }
    }
    return charCount;
  }

  function processPinyin(pinyin: string): string[][] {
    const toneMap: { [key: string]: string } = {
      'ā': 'a-1', 'á': 'a-2', 'ǎ': 'a-3', 'à': 'a-4',
      'ē': 'e-1', 'é': 'e-2', 'ě': 'e-3', 'è': 'e-4',
      'ī': 'i-1', 'í': 'i-2', 'ǐ': 'i-3', 'ì': 'i-4',
      'ō': 'o-1', 'ó': 'o-2', 'ǒ': 'o-3', 'ò': 'o-4',
      'ū': 'u-1', 'ú': 'u-2', 'ǔ': 'u-3', 'ù': 'u-4',
      'ǖ': 'ü-1', 'ǘ': 'ü-2', 'ǚ': 'ü-3', 'ǜ': 'ü-4'
    };

    const splitPinyin = pinyin.split(' ');
    const result: string[][] = [];

    splitPinyin.forEach((word) => {
      const processedWord: string[] = [];
      let tempWord = word;
      if (/[jqxy]u/.test(tempWord)) {
        tempWord = tempWord.replace(/u/g, 'ü');
      }
      for (let i = 0; i < tempWord.length; i++) {
        if (toneMap[tempWord[i]]) {
          processedWord.push(toneMap[tempWord[i]]);
        } else {
          processedWord.push(tempWord[i]);
        }
      }
      result.push(processedWord);
    });

    return result;
  }

  function isLengthCharacterIdiom(targetIdiom: string, length: number): boolean {
    if (targetIdiom.length !== length) {
      return false;
    }

    const chineseRegex = /^[\u4e00-\u9fa5]+$/;
    if (!chineseRegex.test(targetIdiom)) {
      return false;
    }

    return true;
  }

  function writeIdiomsToFile(filePath: string, idiomsList: Idiom[]): void {
    try {
      const jsonData = JSON.stringify(idiomsList, null, 2);
      fs.writeFileSync(filePath, jsonData, 'utf-8');
    } catch (error) {
      logger.error("将名字|名字写入文件时出错：", error);
    }
  }

  async function getIdiomInfo(idiom: string): Promise<{ pinyin: string, explanation: string }> {
    try {
      const response = await fetch(`https://dict.baidu.com/s?wd=${idiom}&device=pc&ptype=zici`);
      if (!response.ok) {
        throw new Error('未能提取数据。');
      }

      const html = await response.text();

      // fs.writeFileSync(`${idiom}.html`, html, 'utf8');
      const $ = load(html);
      const basicMeanWrapper = $("#basicmean-wrapper");

      const pinyin = basicMeanWrapper.find(".tab-content .pinyin-font").text().trim();
      const explanation = basicMeanWrapper.find(".tab-content dd p").text().trim();

      if (!pinyin || !explanation) {
        throw new Error('找不到拼音或解释。');
      }
      if (!isIdiomInList(idiom, idiomsList)) {
        const newIdiom: Idiom = {
          idiom,
          pinyin,
          explanation: '【解释】' + explanation,
        };
        idiomsList.push(newIdiom);
        writeIdiomsToFile(idiomsKoishiFilePath, idiomsList);
      }
      return { pinyin, explanation };
    } catch (error) {
      return { pinyin: '未找到拼音', explanation: '未找到解释' };
    }
  }

  function checkAbsentLetters(lowercaseInputWord: string, absentLetters: string): boolean {
    for (let i = 0; i < lowercaseInputWord.length; i++) {
      if (absentLetters.includes(lowercaseInputWord[i])) {
        return true;
      }
    }
    return false;
  }

  function checkPresentLettersWithIndex(lowercaseInputWord: string, presentLettersWithIndex: string[]): boolean {
    let isInputWordWrong = false;

    presentLettersWithIndex.forEach(item => {
      const [letter, indexStr] = item.split('-');
      const index = parseInt(indexStr, 10) - 1;

      if (lowercaseInputWord.length > index && lowercaseInputWord[index] === letter) {
        isInputWordWrong = true;
      }
    });

    return isInputWordWrong;
  }

  function getRandomFromStringList(words: string[]): string {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex].toLowerCase();
  }

  function generateImageTags(buffers: Buffer[]): string {
    return buffers
      .map((buffer, index) => {
        const base64Image = buffer.toString('base64');
        return `    <img src="data:image/png;base64,${base64Image}" alt="图片${index + 1}">`;
      })
      .join('\n');
  }

  function replaceEscapeCharacters(input: string): string {
    return input.replace(/\\r/g, '\r').replace(/\\n/g, '\n');
  }

  function removeLetters(wordAnswer: string, absentLetters: string): string {
    const letterSet = new Set(wordAnswer);
    return absentLetters.split('').filter(letter => !letterSet.has(letter)).join('');
  }

  function calculateGameDuration(startTime: number, currentTime: number): string {
    const elapsedMilliseconds = currentTime - startTime;
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    if (minutes > 0) {
      return `用时：【${minutes} 分 ${seconds} 秒】`;
    } else {
      return `用时：【${seconds} 秒】`;
    }
  }

  function uniqueSortedLowercaseLetters(input: string): string {
    const uniqueLetters = Array.from(new Set(input.toLowerCase().match(/[a-z]/g)));
    return uniqueLetters.sort().join('');
  }

  function mergeSameLetters(arr: string[]): string[] {
    const seen: { [key: string]: boolean } = {};
    const result: string[] = [];

    for (let i = 0; i < arr.length; i++) {
      const currentLetter = arr[i];
      if (!seen[currentLetter]) {
        result.push(currentLetter);
        seen[currentLetter] = true;
      }
    }

    return result;
  }

  function generateGameEndMessage(gameInfo: GameRecord): string {
    return `答案是：【${gameInfo.wordGuess}】${gameInfo.wordAnswerChineseDefinition !== '' ? `${gameInfo.pinyin === '' ? '' : `\n拼音为：【${gameInfo.pinyin}】`}\n释义如下：\n${replaceEscapeCharacters(gameInfo.wordAnswerChineseDefinition)}` : ''}`;
  }

  function generateStyledHtml(row: number): string {
    // noinspection CssInvalidFunction
    const styledHtml = `
<style>
        .Row-module_row__pwpBq {
            display: grid;
            grid-template-columns: repeat(${row - 1}, 1fr);
            grid-gap: 5px;
        }

        .Board-module_board__jeoPS {
            display: grid;
            grid-template-rows: repeat(${row}, 1fr);
            grid-gap: 5px;
            padding: 10px;
            box-sizing: border-box;
        }
    </style>`;

    return styledHtml;
  }

  function generateEmptyGridHtml(rowNum: number, tileNum: number): string {
    let html = '';
    for (let i = 0; i < rowNum; i++) {
      html += `<div class="Row-module_row__pwpBq">`;
      for (let j = 0; j < tileNum; j++) {
        html += `
        <div>
            <div class="Tile-module_tile__UWEHN" data-state="empty"></div>
            <!--第${i + 1}行第${j + 1}列-->
        </div>`;
      }
      html += `</div>`;
    }
    return html;
  }

  function generateEmptyGridHtmlForCiying(rowNum: number, tileNum: number, isBorder: boolean): string {
    let html = '';
    for (let i = 0; i < rowNum; i++) {
      html += `<div class="relative flex items-center">
                        <div class="grid grid-cols-4 justify-items-center gap-2 svelte-n2hnfv">`;
      for (let j = 0; j < tileNum; j++) {
        html += `
        <!--第${i + 1}行第${j + 1}列-->
         <input enterkeyhint="done" disabled="" class="h-32 w-32 border-2 bg-transparent text-center font-serif text-5xl border-neutral-300 dark:border-neutral-700 ${isBorder ? 'border-neutral-500 dark:border-neutral-500' : ''}" placeholder="">
                            `;
      }
      html += `   </div>
                    </div>`;
    }
    return html;
  }

  function generateEmptyGridHtmlForHandle(rowNum: number, tileNum: number): string {
    let html = '';
    for (let i = 0; i < rowNum; i++) {
      html += `<div flex="">`;
      for (let j = 0; j < tileNum; j++) {
        html += `
        <!--第${i + 1}行第${j + 1}列-->
        <div w-30="" h-30="" m2="">
            <div h-30="" w-30="" border-4="" flex="~ center" relative="" leading-1em="" font-serif=""
                 class="bg-gray-400/8">
            </div>
        </div>`;
      }
      html += `</div>`;
    }
    return html;
  }

  const defaultPinyinsHtml = `                    <div grid="~ cols-2 gap-3" h-min="">
                        <div class="">b</div>
                        <div class="">p</div>
                        <div class="">m</div>
                        <div class="">f</div>
                        <div class="">d</div>
                        <div class="">t</div>
                        <div class="">n</div>
                        <div class="">l</div>
                        <div class="">g</div>
                        <div class="">k</div>
                        <div class="">h</div>
                        <div class="">j</div>
                        <div class="">q</div>
                        <div class="">r</div>
                        <div class="">x</div>
                        <div class="">w</div>
                        <div class="">y</div>
                        <div class="">zh</div>
                        <div class="">ch</div>
                        <div class="">sh</div>
                        <div class="">z</div>
                        <div class="">c</div>
                        <div class="">s</div>
                    </div>
                    <div grid="~ cols-3 gap-3" h-min="">
                        <div class="">a</div>
                        <div class="">ai</div>
                        <div class="">an</div>
                        <div class="">ang</div>
                        <div class="">ao</div>
                        <div class="">e</div>
                        <div class="">ei</div>
                        <div class="">en</div>
                        <div class="">eng</div>
                        <div class="">er</div>
                        <div class="">i</div>
                        <div class="">ia</div>
                        <div class="">ian</div>
                        <div class="">iang</div>
                        <div class="">iao</div>
                        <div class="">ie</div>
                        <div class="">in</div>
                        <div class="">ing</div>
                        <div class="">io</div>
                        <div class="">iong</div>
                        <div class="">iu</div>
                        <div class="">o</div>
                        <div class="">ong</div>
                        <div class="">ou</div>
                        <div class="">u</div>
                        <div class="">ua</div>
                        <div class="">uai</div>
                        <div class="">uan</div>
                        <div class="">uang</div>
                        <div class="">ui</div>
                        <div class="">un</div>
                        <div class="">uo</div>
                        <div class="">ü</div>
                        <div class="">üan</div>
                        <div class="">üe</div>
                        <div class="">ün</div>
                    </div>`
  // apply
}
