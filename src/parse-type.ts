import type { IEnum, IService, IType } from 'protobufjs';
import { isArray, getTsTypeByPbType, getKeyType } from './utils';
import { searchInClosure } from './closure';
import { Closure, TypeInfoList } from './type';

/**
 * 将pb json中的field转换为ts的类型
 * @param message IType
 * @param closure Closure
 * @returns TypeInfoList
 */
export function parseType(
  message: IType,
  imports: string[],
  closure?: Closure,
): TypeInfoList {
  const fields = message.fields;
  return Object.keys(fields).map((variableName) => {
    const variableValue = fields[variableName];
    const variableType = variableValue.type;
    // @ts-ignore
    const variableComment = variableValue.comment;
    const keyType = getKeyType(variableValue);
    const tsType = getTsType(variableType, imports, closure);

    // 如果是数组
    if (isArray(variableValue)) {
      return {
        tsType: `${tsType}[]`,
        key: variableName,
        comment: variableComment,
      };
    }

    // map类型
    if (keyType) {
      return {
        tsType: `{ [key: ${keyType}]: ${tsType} }`,
        key: variableName,
        comment: variableComment,
      };
    }

    // 普通类型
    return {
      tsType,
      key: variableName,
      comment: variableComment,
    };
  });
}

/**
 * 将pb json中的枚举转换为ts类型的枚举
 * @param message IEnum
 * @returns TypeInfoList
 */
export function parseEnum(message: IEnum): TypeInfoList {
  const values = message.values;
  // @ts-ignore
  const comments = message.comments;
  return Object.keys(values).map((enumName) => {
    const enumValue = values[enumName];
    const comment = comments[enumName];

    // 普通类型
    return {
      tsType: enumValue,
      key: enumName,
      comment,
    };
  });
}

/**
 * 将pb json中的枚举转换为ts类型的函数
 * @param message IService
 * @returns TypeInfoList
 */
export function parseService(message: IService, imports: string[], closure?: Closure): TypeInfoList {
  const methods = message.methods;
  return Object.keys(methods).map((methodName) => {
    const method = methods[methodName];
    // @ts-ignore
    const { requestType, responseType, comment } = method;
    const tsRequestType = getTsType(requestType, imports, closure);
    const tsResponseType = getTsType(responseType, imports, closure);
    const tsType = `(params: ${tsRequestType}) => Promise<${tsResponseType}>;`;

    // 普通类型
    return {
      tsType,
      key: methodName,
      comment,
    };
  });
}

/**
 * 获取ts类型
 * @param variableType string
 * @param closure Closure
 */
export function getTsType(variableType: string, imports: string[], closure?: Closure) {
  let tsType = getTsTypeByPbType(variableType);

  // 没有type，并且有闭包的情况下，去闭包中找数据
  if (!tsType && closure) {
    tsType = searchInClosure(variableType, closure, imports);
  }
  if (!tsType) {
    throw new Error(`未找到类型为：${variableType}的定义`);
  }

  return tsType;
}
