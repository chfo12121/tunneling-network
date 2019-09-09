module.exports = function requireHead(type, address = '0.0.0.0', port = 0) {
    /**
     * 目前type 0是tcp，3是udp
     */
    type = Buffer.from([type])
    address = Buffer.from(address + '\n')
    port = Buffer.from(Uint16Array.of(port).buffer)
    let meta = Buffer.concat([type, address, port])
    let sum = Buffer.from([meta.reduce((a, b) => a + b)])
    return Buffer.concat([meta, sum])
}