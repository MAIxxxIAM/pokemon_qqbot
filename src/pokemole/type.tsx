export interface PokemonInfo {
  sections: [
    {
      title: "名称";
      value: string[];
      hasArrow: "↑" | "↓" | "";
      bgColor: string[];
    },
    {
      title: "属性";
      value: string[];
      hasArrow: "↑" | "↓" | "";
      bgColor: string[];
    },
    {
      title: "种族值";
      value: string[];
      hasArrow: "↑" | "↓" | "";
      bgColor: string[];
    },
    {
      title: "世代";
      value: string[];
      hasArrow: "↑" | "↓" | "";
      bgColor: string[];
    },
    {
      title: "特性";
      value: string[];
      hasArrow: "↑" | "↓" | "";
      bgColor: string[];
    },
    {
      title: "进化";
      value: string[];
      hasArrow: "↑" | "↓" | "";
      bgColor: string[];
    },
    {
      title: "其他";
      value: string[];
      hasArrow: "↑" | "↓" | "";
      bgColor: string[];
    }
  ];
}
