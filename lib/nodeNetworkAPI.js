const net = require('net')
const dgram = require('dgram')
let log = require('../utils/log')
let proxyRule = require('../utils/proxyRule')
const connectType = require('../lib/connectType')
let requireHead = require('../lib/requireHead')

/**
 * hack tcp connect
 * 根据现在的node源码，所有tcp链接相关的api都通过Socket.prototype.connect
 */
function connectProxy(proxyHost, proxyPort) {
    let normalizedArgsSymbol = Object.getOwnPropertySymbols(net._normalizeArgs([]))[0]
    return new Proxy(net.Socket.prototype.connect, {
        /**
         * @returns thisArg
         */
        apply(target, thisArg, argumentsList) {
            if (!proxyHost || !proxyPort) {
                return Reflect.apply(target, thisArg, argumentsList)
            }
            // normalize之前先读取type
            let type = argumentsList[0] && argumentsList[0][connectType] || 0
            // 以normalized为最终参数
            // 判断原理，详见node源码
            let normalized
            if (Array.isArray(argumentsList[0]) && argumentsList[0][normalizedArgsSymbol]) {
                normalized = argumentsList[0]
            }
            else {
                normalized = net._normalizeArgs(argumentsList)
            }
            let [options] = normalized
            let { host, port } = options
            if (type || proxyRule(host)) {
                // 从源码得知，options是新建对象，不影响外部
                options.host = proxyHost
                options.port = proxyPort
                log('tcp', 'connect', `${host}:${port}`)
                target.call(thisArg, normalized)
                if (!options.path) {
                    thisArg.write(requireHead(type, host, port))
                }
                // socket伪装
                thisArg.remoteAddress//=
                thisArg.remotePort//=
                thisArg.bytesWritten//=
            }
            else {
                target.call(thisArg, normalized)
            }
            return thisArg
        },
    })
}

/**
 * hack udp send
 * 为了简单统一，udp发送用tcp模拟
 */
function sendProxy(proxyHost, proxyPort) {
    let helperServerEstablished = new Promise((resolve, reject) => {
        dgram.createSocket('udp4').bind(function () {
            resolve(this.address().port)
        }).on('message', (msg, rinfo) => {
            let chunks = []
            // 同样，走socket.connect
            let socket = new net.Socket
            socket.connect({
                host: address,
                port: port,
                [connectType]: 3,
            }).on('data', (chunk) => {
                chunks.push(chunk)
            }).on('end', () => {
                let msg = Buffer.concat(chunks)
                thisArg.emit('message', msg, {})
            }).end(msg)
        }).unref()
    })
    let kStateSymbol = Object.getOwnPropertySymbols(dgram.createSocket('udp4'))[1]
    return new Proxy(dgram.Socket.prototype.send, {
        apply(target, thisArg, argumentsList) {
            if (!proxyHost || !proxyPort) {
                return Reflect.apply(target, thisArg, argumentsList)
            }
            let [buffer,
                offset,
                length,
                port,
                address,
                callback] = argumentsList
            // 参考node源码
            if (thisArg[kStateSymbol].connectState !== 2) {
                if (!address && (!port || typeof port === 'function')) {
                    callback = port
                    port = offset
                    address = length
                    if (!proxyRule(address)) {
                        return Reflect.apply(target, thisArg, argumentsList)
                    }
                    log('udp', 'send', `${address}:${port}`)
                    helperServerEstablished.then((helperPort) => {
                        let chunks = []
                        // 同样，走socket.connect
                        let socket = new net.Socket
                        socket.connect({
                            host: address,
                            port: port,
                            [connectType]: 3,
                        }).on('data', (chunk) => {
                            chunks.push(chunk)
                        }).on('end', () => {
                            let msg = Buffer.concat(chunks)
                            thisArg.emit('message', msg, {})
                        }).end(buffer)
                    })
                }
                else {
                    return Reflect.apply(target, thisArg, argumentsList)
                }
            }
            else {
                return Reflect.apply(target, thisArg, argumentsList)
            }
        },
    })
}

module.exports = async (proxyHost, proxyPort) => {
    const { connect } = net.Socket.prototype
    const { send } = dgram.Socket.prototype
    net.Socket.prototype.connect = connectProxy(proxyHost, proxyPort)
    dgram.Socket.prototype.send = sendProxy(proxyHost, proxyPort)
    // 后续程序可以获取原来的方法
    return {
        connect,
        send,
    }
}