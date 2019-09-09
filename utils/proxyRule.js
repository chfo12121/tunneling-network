/**
 * 根据ip端口判断要不要代理，还是直连
 */

let bypass
try {
    bypass = require(require('path').join(process.cwd(), 'package'))['tunneling-network-bypass']
}
catch{ }

module.exports = (address = '', port = '') => {
    if (
        bypass && bypass.some((item) => {
            return item == address || item == `${address}:${port}`
        })
    ) {
        return false
    }
    return true
}