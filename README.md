# pb-to-ts 
将protobuf转换成typescript类型文件（支持注释，支持import依赖）

## 使用

### 安装
```sh
npm install pb-to-ts
```

### 单个目录
```javascript
import Pbts from 'pb-to-ts';

const pbts = new Pbts({
  input: './proto/xxx',
  output: './src/types/xxx/',
})

pbts.compile()
```

### 多个目录
```javascript
import Pbts from 'pb-to-ts';

const pbts1 = new Pbts({
  input: './proto/xxx',
  output: './src/types/xxx/',
})

const pbts2 = new Pbts({
  input: './proto/xxx',
  output: './src/types/xxx/',
})

pbts1.compile()

pbts2.compile()
```