import type { AnyNestedObject } from 'protobufjs';
import { Closure, PbType } from './type';

export type CustomAnyNestedObject = AnyNestedObject & {
  [key: string]: any
};

/**
 * 寻找依赖
 * @param prefix string
 * @param nested AnyNestedObject
 * @returns Closure
 */
export function searchDependency(
  prefix: string, // 前缀
  nested?: CustomAnyNestedObject, // 包里面的内容
): Closure {
  // 起始闭包
  const closure: Closure = {
    nextClosures: {},
    parentClosure: null,
    content: {},
  };
  // 遍历嵌套的message
  if (nested) {
    Object.keys(nested)?.forEach((messageName) => {
      // 嵌套的message属于当前可访问的作用域
      let moduleName = messageName;
      if (prefix) {
        // 如果有前缀，就加上
        moduleName = `${prefix}.${messageName}`;
      }
      closure.content[messageName] = moduleName;

      // 默认的闭包
      const defaultClosure: Closure = {
        nextClosures: {},
        parentClosure: null,
        content: {},
      };
      // 因为这里最远端的叶子节点没有后续的嵌套了，所以这里给个默认值
      closure.nextClosures[messageName] = defaultClosure;
      defaultClosure.parentClosure = closure;
      const message: { [key: string]: CustomAnyNestedObject } = nested[messageName];
      Object.keys(message).forEach((type) => {
        switch (type) {
          case PbType.NESTED: {
            const newNested = message[type];

            // 如果有嵌套就递归去找
            const newClosure = searchDependency(moduleName, newNested);

            // 嵌套里面的闭包，属于自己的作用域，外层无法访问
            closure.nextClosures[messageName] = newClosure;
            newClosure.parentClosure = closure;
            break;
          }
          // TODO 暂时无需处理
          // case PbType.ENUM: {
          // }
        }
      });
    });
  }
  return closure;
}
