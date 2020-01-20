<h1 align="center">Finger.Taro</h1>

web手势库，基于AlloyFinger的 Taro 库,可以快速帮助你的 web 程序增加手势支持，也不用再担心 click 300ms 的延迟了；


## 安装

```bash
  
  npm install finger.taro -S

```

```bash
  
  yarn add finger.taro -S

```

## API

### props

|参数        |说明               |类型           |默认值 |
|------------|-------------------|---------------|------|
|`onLeft`    |  向左滑动回调函数  |  `function`  |  -   |
|`onRight`   | 向右滑动的回调函数|  `function`   |  -   | 

### 未添加的功能

|参数        |说明               |类型           |默认值 |
|------------|-------------------|---------------|------|
|`pinch`    |  缩放回调函数  |  `function`  |  -   |
|`rotate`   | 旋转回调函数|  `function`   |  -   | 
|`pressMove`    | 拖拽回调函数  |  `function`  |  -   |
|`swipe`    |  滑动回调函数  |  `function`  |  -   |
|`longTap`   | 长按回调函数  |  `function`  |  -   |
|`singleTap`  |  单击回调函数  |  `function`  |  -   |
|`doubleTap`  |  双击回调函数  |  `function`  |  -   |


## 使用

### 使用的文件

```javascript
  
  import Finger from 'finger.taro'

  const App = () => (
    <>
      <FingeTaro
        onRightFn={() => fn()}
        onLeft={()=>fn()}
      >
        ....
      <FingeTaro />
    </>
  );

```

### 修改 `config/index.js`

```javascript
  const config = {
    ...
    h5: {
      ...
      esnextModules: ['finger.taro'],
    },
  }

```

### 注意事项

  使用前请确保项目中已经安装了Taro相关的库，主要有如下：

  - `@tarojs/taro`

  - `nervjs`

  - `@tarojs/components`
 




