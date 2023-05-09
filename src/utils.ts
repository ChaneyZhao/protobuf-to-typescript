import fs from 'fs';
import path from 'path';
import type { IField, IMapField } from 'protobufjs';

/** ts的基础类型 */
declare const enum TsType {
  NUMBER = 'number',
  STRING = 'string',
  BOOLEAN = 'boolean'
}

/** pb类型和ts类型映射 */
const TYPES_MAP: {
  [key: string]: TsType;
} = {
  double: TsType.NUMBER,
  float: TsType.NUMBER,
  int32: TsType.NUMBER,
  uint32: TsType.NUMBER,
  sint32: TsType.NUMBER,
  fixed32: TsType.NUMBER,
  sfixed32: TsType.NUMBER,

  int64: TsType.STRING,
  uint64: TsType.STRING,
  sint64: TsType.STRING,
  fixed64: TsType.STRING,
  sfixed64: TsType.STRING,
  string: TsType.STRING,
  bytes: TsType.STRING,

  bool: TsType.BOOLEAN,
};

/**
 * 是不是数组
 * @param field IField
 * @returns boolean
 */
export function isArray(field: IField) {
  const ARRAY_PB_TYPE = 'repeated';
  return field.rule === ARRAY_PB_TYPE;
}

/**
 * 是不是map
 * @param p Partial<IMapField>
 * @returns string
 */
export function getKeyType(p: Partial<IMapField>) {
  if (p.keyType) {
    return TYPES_MAP[p.keyType] || p.keyType;
  }
  return '';
}

/**
 * 是不是函数
 * @param func any
 * @returns boolean
 */
export function isFunction(func: any): boolean {
  return typeof func !== 'function';
}

/**
 * 根据Pb的类型获取ts的类型
 * @param pbType string
 * @returns string
 */
export function getTsTypeByPbType(pbType: string): string {
  const tsType = TYPES_MAP[pbType];

  // 如果不在配置里面，说明是自定义类型
  if (!tsType) {
    return '';
  }
  return tsType;
}

/**
 * 路径处理
 * @param filePath string
 * @returns string
 */
export function resolve(filePath: string): string {
  return path.resolve(process.cwd(), filePath);
}

/**
 * 写文件
 * @param filePath string
 * @param content string
 */
export function writeFileSync(filePath: string, content: string) {
  fs.writeFileSync(resolve(filePath), content);
}

/**
 * 读取该路径下的所有文件
 * @param dirPath string
 * @param cb fn
 */
export function readAllFiles(
  dirPath: string,
  cb: (fileName: string, absoluteFilePath: string) => void,
) {
  const dirArr = fs.readdirSync(resolve(dirPath));
  dirArr.forEach((fileName) => {
    // 文件件的绝对路径
    const absoluteFilePath: string = resolve(`${dirPath}/${fileName}`);
    const fileState = fs.lstatSync(absoluteFilePath);

    // 如果是个文件，就直接读取
    if (fileState.isFile()) {
      cb(fileName, absoluteFilePath);
    } else {
      readAllFiles(absoluteFilePath, cb);
    }
  });
}

/**
 * 读文件
 * @param filePath string
 * @param input string
 * @returns string
 */
export function readFileSync(filePath: string, input: string): string {
  filePath = path.resolve(process.cwd(), input, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  return content;
}
