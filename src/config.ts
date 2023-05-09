/** ts声明的文件后缀 */
export const TS_EXT = '.ts';

/** pb文件的后缀 */
export const PB_EXT = '.proto';

/** 默认的namespace */
export const DEFAULT_NAMESPACE = 'proto';

/** 默认的编译参数选项 */
export const DEFAULT_OPTIONS = {
  /** proto文件路径 */
  input: './input/',
  /** 转换之后ts输出路径 */
  output: './output/',
  /** 是否需要将pb类型转为驼峰 */
  isHump: true,
  /** 是否为可选 */
  isOptional: false,
  /** eslint config ignore */
  eslintIgnoreList: [
    '@typescript-eslint/no-unused-vars',
    '@typescript-eslint/no-empty-interface',
    '@typescript-eslint/no-namespace',
    'max-len',
  ],
};
