import { Closure } from './type';

/**
 * 从闭包中找值
 * @param key string
 * @param closure Closure
 * @returns string
 */
export function searchInClosure(key: string, closure: Closure, imports: string[]): string {
  let nextClosure: Closure | null = closure;
  while (nextClosure) {
    const content = nextClosure.content || {};
    const target = content[key];
    if (target) {
      // 如果是唯一的value，直接return
      if (typeof target === 'string') {
        return target;
      }

      // 如果target是数组，需要跟imports依赖的proto文件名匹配，找出当前文件依赖的proto文件名
      let targetKey = '';
      imports?.forEach((item) => {
        target?.forEach((child) => {
          if (item.split('.')?.[0] === child.split('.')?.[0]) {
            targetKey = child;
          }
        });
      });

      if (targetKey) {
        return targetKey;
      }
    }
    nextClosure = nextClosure.parentClosure;
  }
  return '';
}
