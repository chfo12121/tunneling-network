## 这东西有什么用？
没啥用！

正常情况下。

这工具有使用场景是一种悲哀。

但是有的网络环境下封锁隔离过于坑：

你是否遭受过

某些机器上运行着很多服务，你想享受服务，但

http.request('http://某服务地址/') 请求不了

MongoClient.connect('mongodb://某服务地址:27017/mydb') 连不了

new Memcached('某服务地址:11211') 连不了

net.connect(port, '某服务地址') 访问不了

udp.send(message, port, '某服务地址') 发送失败

...

我***

发现只有一两个端口开放，可以tcp连接玩玩。这时候，使用这模块，让一切连通，不用你改任何代码。使用十分简单。
## 使用方法
只需要在你的启动命令前增加环境变量：`NODE_OPTIONS='-r tunneling-network' NODE_TUNNELING_NETWORK_PROXY=<地址>:<端口>`即OK.

例如：

package.json
```

{
  ...
  "devDependencies": {
    ...
    "tunneling-network": "*",
    "cross-env": "*",
    ...
  },
  "scripts": {
    ...
    "start": "my-start-command arg",
    "tunneling-start": "cross-env NODE_OPTIONS=\"-r tunneling-network\" NODE_TUNNELING_NETWORK_PROXY=192.168.1.2:8080 my-start-command arg",
    ...
  },
  "tunneling-network-bypass": [
    "",
    "localhost",
    "127.0.0.1"
  ],
  ...
}
```

`npm i -D`

`npm run tunneling-start`

在当前目录package.json中添加如`"tunneling-network-bypass": ["127.0.0.1", "localhost:8080"]`可指定地址不通过代理。

如果没代理服务，需要先在那边网络启动服务，上面的环境变量中<地址>:<端口>就是这个，也很简单，本模块已提供：
```
node ./node_modules/tunneling-network/server 8080
```
8080替换成自己要的端口。（需要条件：远程机器上可tcp连接的端口。80、443、8080、8081、1024...比较可能开放。）

使用本模块也许违反网络防火策略（如果策略太坑，我会违反），所有安全规范问题你自己想，我不负责。

其它便利功能：

本地运行，命令格式
```
node ./node_modules/tunneling-network/server ":<local>=><tunneling-server>=><target>" ":<local>=><tunneling-server>=><target>" ...
```
如`node ./node_modules/tunneling-network/server ":8080=>192.168.1.2:8080=>9.134.55.75:27017" ":8081=>192.168.1.2:8080=>9.134.55.75:3307"`，注意引号，不然重定向。

tunneling-server就是你上面起的。

这样可以用本地电脑的gui填写127.0.0.1:8080连接上9.134.55.75:27017的mongodb，填写127.0.0.1:8081连接上9.134.55.75:3307的mysql，其它数据库、redis等一样道理。
## 基本原理解释
这功能简单讲就是代理服务，所以需要搭服务以及命令有地址参数。

组件只是建立通道之后把node发出的网络数据通过通道与目标服务连接，对你的代码逻辑基本没影响，支持转换node程序所有基于内建模块的网络通信。
## 功能反馈
这工具目前的实现利用到没在Node.js文档公开的属性与方法，不确定随node版本变化正常使用。