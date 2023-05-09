import fs from 'fs';
import path from 'path';
import type {
  IEnum, INamespace, IService, IType,
} from 'protobufjs';
import * as protobuf from '../libs/protobuf';
import { DEFAULT_OPTIONS, PB_EXT, TS_EXT } from './config';
import { CustomAnyNestedObject, searchDependency } from './dependency';
import {
  generateEnum,
  generateEslintIgnore,
  generateImport,
  generateInterface,
  generateNamespace,
  generateService,
} from './generate';
import { parseEnum, parseService, parseType } from './parse-type';
import {
  isFunction, readAllFiles, readFileSync, writeFileSync,
} from './utils';
import {
  ActionInfo, Closure, ParseOptions, PbType,
} from './type';

export interface CompileOptions {
  /** .proto文件路径 */
  input: string
  /** 转换的ts输出路径 */
  output: string
  /** 是否需要将pb类型转为驼峰 */
  isHump?: boolean
  /** 是否为可选 */
  isOptional?: boolean
  /** eslint config ignore */
  eslintIgnoreList?: string[]
}

export default class Pbts {
  /** 转换参数 */
  private compileOptions: CompileOptions;

  /** 环，用户缓存key value */
  private loopHash: { [key: string]: string; } = {};

  /** 根作用域 */
  private rootClosure: Closure = {
    nextClosures: {},
    parentClosure: null,
    content: {},
  };

  /** action resolve */
  private actions: {
    [key: string]: (obj: ActionInfo) => string;
  } = {
      [PbType.SERVICE]: ({
        message, closure, messageName, imports,
      }: ActionInfo): string => {
        // 当前作用域的闭包
        const scopeClosure = closure.nextClosures[messageName];

        // 普通类型转换
        const typeInfoList = parseService(message as IService, imports, scopeClosure);

        // 生成函数类型
        const output = generateService(typeInfoList);
        return output;
      },
      [PbType.ENUM]: ({
        message,
        messageName,
      }: ActionInfo): string => {
        // 普通类型转换
        const typeInfoList = parseEnum(message as IEnum);

        // 生成枚举类型
        const output = generateEnum(
          typeInfoList,
          messageName,
          message,
        );
        return output;
      },
      [PbType.NESTED]: ({
        message,
        closure,
        messageName,
        imports,
      }: ActionInfo): string => {
        // 如果有嵌套的话，就递归的查询
        const newNested = message.nested; // message内部嵌套

        // 递归的话，给他自己的作用域的访问权限（这里是双向链表，写是写入next，查是顺着parent查）,这里当前存在命名空间，所以递归解析的时候，子代肯定无法使用declare声明namespace了，所以直接给false
        let output = this.parseNested(
          newNested,
          closure.nextClosures[messageName],
          imports,
        );

        if (messageName) {
          output = generateNamespace(output, messageName);
        }
        return output;
      },
      [PbType.TYPE]: ({
        message,
        closure,
        messageName,
        imports,
      }: ActionInfo): string => {
        // 当前作用域的闭包
        const scopeClosure = closure.nextClosures[messageName];

        // 普通类型转换
        const typeInfoList = parseType(message as IType, imports, scopeClosure);

        // 生成interface字符串
        const output = generateInterface(typeInfoList, messageName, message, this.compileOptions);
        return output;
      },
    };

  constructor(options?: CompileOptions) {
    this.compileOptions = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 开始转换
   */
  public compile() {
    /**
     * 读取input下所有proto文件，转换为ts，输出到out中
     */
    readAllFiles(
      this.compileOptions.input,
      (fileName: string, absoluteFilePath: string) => {
        // 如果不是pb文件，直接返回
        if (!fileName.endsWith(PB_EXT)) {
          return;
        }
        const source = fs.readFileSync(absoluteFilePath, 'utf8');
        const pb = this.protoBufToTsType(fileName, source, { keepCase: !this.compileOptions.isHump });

        // 替换一下后缀名
        fileName = fileName.replace(PB_EXT, TS_EXT);
        const outputFileName = this.compileOptions.output + fileName;
        writeFileSync(outputFileName, pb);
      },
    );
  }

  /**
   * pb转ts类型
   * @param key string
   * @param source string
   * @param option ParseOptions
   * @returns string
   */
  private protoBufToTsType(
    key: string,
    source: string,
    option?: ParseOptions,
  ): string {
    // 防止循环引用
    if (this.loopHash[key]) {
      return this.loopHash[key];
    }
    this.loopHash[key] = 'ok'; // 这里的ok，只是一个标志位，用于结束循环引用
    const ast = protobuf.parse(source, option);
    const { package: namespace, imports, root } = ast;
    const pbFileJson = root.toJSON({ keepComments: true });
    let nested = pbFileJson.nested;
    if (!nested) {
      return '';
    }

    // 如果内部声明了命名空间，就把打包的内容先吐出来
    if (namespace && nested && nested[namespace]) {
      const iNamespace = nested[namespace] as INamespace;
      nested = iNamespace.nested;
    }

    // 寻找依赖，构建作用域
    const closure = searchDependency('', nested);

    // 如果进行了打包，就在最外层加上一个根作用域，往外暴露
    if (namespace) {
      this.addRootClosure(namespace, closure, key);
    }

    // 有依赖
    if (imports && imports.length > 0) {
      this.dealWithDependence(imports, option);
    }

    // 解析
    let output = this.parseNested(nested, closure, imports || []);

    // 如果有依赖，生成最外层的import依赖
    if (imports && imports.length > 0) {
      output = generateImport(output, imports);
    }

    // 添加eslint ignore配置
    output = generateEslintIgnore(output, this.compileOptions.eslintIgnoreList);

    this.loopHash[key] = output;
    return output;
  }

  /**
   * 添加根作用域
   * @param namespace string
   * @param closure Closure
   * @param fileName string
   */
  private addRootClosure(namespace: string, closure: Closure, fileName: string) {
    // 根作用域里面加上当前的命名空间里所暴露出来的message
    this.rootClosure.nextClosures[namespace] = closure;
    closure.parentClosure = this.rootClosure;

    // 将当前命名空间里最外层的message，暴露给其他模块查找
    Object.keys(closure.content).forEach((key) => {
      // 删除fileName中的.proto字符
      const prefix = fileName.slice(0, -6);
      const contentValue = `${prefix}.${key}`;

      // 如果已经存在这个key了，把value修改为数组
      if (this.rootClosure.content[key]) {
        if (typeof this.rootClosure.content[key] === 'string') {
          this.rootClosure.content[key] = [this.rootClosure.content[key] as string];
        }
        (this.rootClosure.content[key] as string[]).push(contentValue);
      } else {
        this.rootClosure.content[key] = contentValue;
      }
    });
  }

  /**
   * 处理依赖
   * @param imports Array<string>
   * @param option ParseOptions
   */
  private dealWithDependence(
    imports: Array<string>,
    option?: ParseOptions,
  ) {
    // 有依赖的话，就先去解析依赖，注意环
    imports.forEach((dependenceFilePath) => {
      // 并不是proto
      if (!dependenceFilePath.endsWith(PB_EXT)) {
        return;
      }
      const fileName = path.basename(dependenceFilePath, PB_EXT);
      const content = readFileSync(dependenceFilePath, this.compileOptions.input);
      this.protoBufToTsType(fileName + PB_EXT, content, option); // 这里执行完之后会自动往loopHash里面缓存
    });
  }

  /**
   * 如果有闭包的依赖，那么先把所有依赖找出来，塞进作用域中，因为依赖和名称有映射关系，如果后续有循环引用则无法处理，所以要先生成这个名称映射
   * @param nested CustomAnyNestedObject | undefined
   * @param closure Closure
   * @returns string
   */
  private parseNested(
    nested: CustomAnyNestedObject | undefined,
    closure: Closure,
    imports: string[],
  ): string {
    let output = '';
    if (!nested) {
      return output;
    }
    output = Object.keys(nested)
      .map((messageName) => {
        const message = nested[messageName]; // 具体的message
        return Object.keys(message)
          .map((type) => {
            const func = this.actions[type];
            if (isFunction(func)) {
              return '';
            }
            return func({
              message, closure, messageName, imports,
            });
          })
          .join('');
      })
      .join('');

    // 去掉最后一个\n
    if (output.charAt(output.length - 1) === '\n') {
      output = output.slice(0, -1);
    }

    return output;
  }
}
