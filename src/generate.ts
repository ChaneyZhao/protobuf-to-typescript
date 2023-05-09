import type { IEnum, IType } from 'protobufjs';
import type { CompileOptions } from './index';
import { TypeInfoList } from './type';

/**
 * 生成最外层的命名空间
 * @param content string
 * @param namespace string
 * @returns string
 */
export function generateNamespace(
  content: string,
  namespace: string,
) {
  content = content.replace(/\n/g, '\n\u0020\u0020');

  // 去掉最后两个个\u0020
  if (content.charAt(content.length - 1) === '\u0020' && content.charAt(content.length - 2) === '\u0020') {
    content = content.slice(0, -2);
  }

  const namespaceStr = `export namespace ${namespace} {\n\u0020\u0020${content}}\n\n`;
  return namespaceStr;
}

/**
 * 生成ts类型
 * @param typeInfoList TypeInfoList
 * @param messageName string
 * @param message IType
 * @param options CompileOptions
 * @returns string
 */
export function generateInterface(
  typeInfoList: TypeInfoList,
  messageName: string,
  message: IType,
  options: CompileOptions,
) {
  // 拼成一条条的 rule: string;
  const typeStrList = typeInfoList.map((item) => {
    const { key, tsType, comment } = item;
    const commentStr = getCommentStr(comment);
    // 当CompileOptions.isOptional === true 或者 是rpc request参数的时候，设置为optional
    const optionalStr = options.isOptional || messageName?.endsWith('Req') ? '?' : '';
    return `\u0020\u0020${key}${optionalStr}: ${tsType};${commentStr ? ` ${commentStr}` : ''}\n`;
  });
  // @ts-ignore
  const comment = message.comment;
  const commentStr = getCommentStr(comment);
  const typesStr = typeStrList.join('');
  const interfaceStr = `${formatComment(commentStr)}export interface ${messageName} {\n${typesStr}}\n\n`;
  return interfaceStr;
}

/**
 * 生成ts枚举类型
 * @param typeInfoList TypeInfoList
 * @param messageName string
 * @param message IEnum
 * @returns string
 */
export function generateEnum(
  typeInfoList: TypeInfoList,
  messageName: string,
  message: IEnum,
) {
  // 拼成一条条的 rule: string;
  const typeStrList = typeInfoList.map((item) => {
    const { key, tsType, comment } = item;
    const commentStr = getCommentStr(comment);
    return `\u0020\u0020${key} = ${tsType}, ${commentStr}\n`;
  });
  // @ts-ignore
  const comment = message.comment;
  const commentStr = getCommentStr(comment);
  const typesStr = typeStrList.join('');
  const interfaceStr = `${formatComment(commentStr)}export enum ${messageName} {\n${typesStr}}\n\n`;
  return interfaceStr;
}

/**
 * 生成服务类型
 * @param typeInfoList TypeInfoList
 * @returns string
 */
export function generateService(typeInfoList: TypeInfoList) {
  // 拼成一条条的 rule: string;
  const typeStrList = typeInfoList.map((item) => {
    const { key, tsType, comment } = item;
    const commentStr = getCommentStr(comment);
    return `${formatComment(commentStr)}export type ${key} = ${tsType}\n`;
  });
  const typesStr = `${typeStrList.join('\n')}\n`;
  return typesStr;
}

/**
 * 获取评论
 * @param comment string
 * @returns string
 */
export function getCommentStr(comment: string): string {
  const commentStr = comment ? `// ${comment.replace('\n', '\n// ')}` : '';
  return commentStr;
}

/**
 * 格式化评论
 * @param commentStr string
 * @returns string
 */
export function formatComment(commentStr: string) {
  return commentStr ? `${commentStr}\n` : '';
}

/**
 * 生成最外层的import依赖
 * @param content string
 * @returns string
 */
export function generateImport(content: string, imports: string[]): string {
  const importStr = imports?.reduce((str, currentImport) => {
    // 删除fileName中的.proto字符
    const moduleName = currentImport.slice(0, -6);
    return `${str}import * as ${moduleName} from './${moduleName}';\n`;
  }, '');

  return `${importStr}\n${content}`;
}

/**
 * 在每个生成的文件顶部添加eslint ignore配置
 * @param content string
 * @returns string
 */
export function generateEslintIgnore(content: string, eslintIgnoreList?: string[]): string {
  const eslintIgnore = eslintIgnoreList?.length
    ? eslintIgnoreList.reduce((totalIgnore, currentEslintIgnore, index) => totalIgnore = `${totalIgnore}/* eslint-disable ${currentEslintIgnore} */${index === eslintIgnoreList.length - 1 ? '' : '\n'}`, '')
    : '';

  return `${eslintIgnore}\n${content}`;
}
