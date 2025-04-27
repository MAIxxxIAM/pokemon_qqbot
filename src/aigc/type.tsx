export interface MonsterInfo {
  是否末日宝可梦: boolean;
  宝可梦名称: string;
  日期: string;
  外貌特征: string[];
  末日宝可梦特征: string[];
  活跃地区: string[];
  认证信息: {
    出生日期: string;
    宝可梦名称: string;
    全国编号: string;
  };
}
