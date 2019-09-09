/**
 * server peer
 * 有权限的机器运行此服务，处理办公电脑发来的请求
 */

const net = require('net')
let requireHead = require('./lib/requireHead')

module.exports = ({
    listenPort,
    forward
}) => {
    net.createServer({
        allowHalfOpen: true,
    }, (clientSocket) => {
        if (forward) {  // 用于对指定服务转换为代理协议
            let { host: forwardHost, port: forwardPort, head } = forward
            let forwardSocket = net.createConnection({
                host: forwardHost,
                port: forwardPort,
                allowHalfOpen: true,
            })
            if (head) {
                forwardSocket.write(requireHead(0, head.address, head.port))
            }
            clientSocket.on('error', () => {
                forwardSocket.end()
            }).pipe(forwardSocket)
            forwardSocket.on('error', () => {
                clientSocket.end()
            }).pipe(clientSocket)
            return
        }
        // once
        clientSocket.once('data', (chunk1) => {
            // 会不会出现chunk1不完整的情况？？

            let type = chunk1[0]
            let addressEnd = chunk1.slice(1).indexOf(10) + 1
            let forwardAddress = chunk1.slice(1, addressEnd).toString()
            let forwardPort = chunk1.readUInt16LE(addressEnd + 1)
            let sum = chunk1[addressEnd + 3]
            if (Buffer.from([chunk1.slice(0, addressEnd + 2).reduce((a, b) => a + b)])[0] !== sum) {
                clientSocket
            }
            let content = chunk1.slice(addressEnd + 4)
            if (type) {
                let chunks = [content]
                clientSocket.on('data', (chunk) => {
                    chunks.push(chunk)
                }).on('end', () => {
                    chunks = Buffer.concat(chunks)
                    switch (type) {
                        case 3:
                            // console.log(type, forwardAddress, forwardPort, 'complete', chunks)
                            var a = dgram.createSocket('udp4').on('message', (msg, rinfo) => {
                                clientSocket.end(msg)
                            }).on('error', (...args) => {
                                // console.log(args)
                            }).send(chunks, forwardPort, forwardAddress, (err) => {
                                if (err) {
                                    // console.log(err)
                                }
                            })
                            break
                    }
                })
            } else {
                // console.log(type, forwardAddress, forwardPort, content)
                let forwardSocket = net.createConnection({
                    host: forwardAddress,
                    port: forwardPort,
                    allowHalfOpen: true,
                })
                forwardSocket.write(content)
                clientSocket.on('error', () => {
                    forwardSocket.end()
                }).pipe(forwardSocket)
                forwardSocket.on('error', () => {
                    clientSocket.end()
                }).pipe(clientSocket)
            }
        })
    }).listen(listenPort, () => {
        console.log(`tunneling-network/server listening on port ${listenPort}`)
    })
}

/**
 * node ./node_modules/tunneling-network/server <port>'
 * node ./node_modules/tunneling-network/server ":<local>=><tunneling-server>=><target>" ":<local>=><tunneling-server>=><target>" ...
 */
if (require.main === module) {
    if (process.argv[2][0] === ':') {
        let [, , ...forwardList] = process.argv
        forwardList.forEach((forward) => {
            let [listenPort, proxy, target] = forward.split('=>')
            listenPort = +listenPort.slice(1)
            proxy = proxy.split(':')
            target = target.split(':')
            module.exports({
                listenPort,
                forward: {
                    host: proxy[0],
                    port: +proxy[1],
                    head: {
                        address: target[0],
                        port: +target[1],
                    },
                },
            })
        })
    }
    else {
        module.exports({ listenPort: +process.argv[2] })
    }
}