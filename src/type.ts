/** 闭包 */
export type Closure = {
  nextClosures: {
    [key: string]: Closure;
  }; // 指针
  parentClosure: Closure | null; // 指针
  content: {
    // 主体
    [key: string]: string | string[];
  };
};

/** 解析的选项 */
export type ParseOptions = {
  keepCase: boolean;
};

/** type信息的类型 */
export type TypeInfoList = {
  tsType: string | number;
  key: string;
  comment: string;
}[];

/** pb需要转换的类型 */
export const enum PbType {
  /** 协议 */
  SERVICE = 'methods',
  /** 枚举 */
  ENUM = 'values',
  /** 数据类型 */
  TYPE = 'fields',
  /** 嵌套 */
  NESTED = 'nested'
}

/** action 的参数 */
export type ActionInfo = {
  closure: Closure;
  /** message信息 */
  message: any;
  /** message的名称 */
  messageName: string;
  /** 依赖的proto文件名列表 */
  imports: string[]
};
