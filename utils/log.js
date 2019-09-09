const chalk = require('chalk')

module.exports = function (moduleName, method, args, result, remark) {
    console.log(
        chalk.bgYellow.blue('tunnel'),
        chalk.magenta.bold(moduleName),
        chalk.green(method),
        args ? args : '',
        result ? '=> ' + result : '',
        remark ? chalk.yellow.bold(remark) : ''
    )
}