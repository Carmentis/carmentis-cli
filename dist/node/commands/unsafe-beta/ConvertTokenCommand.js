"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertTokenCommand = void 0;
const safeCommandRunner_1 = require("../safeCommandRunner");
const server_1 = require("@cmts-dev/carmentis-sdk/server");
class ConvertTokenCommand {
    static register(program) {
        program
            .command('convert-token <amount>')
            .description('Convert token amount between different units')
            .option('--unit <unit>', 'Target unit (CMTS or ATOMIC)', 'CMTS')
            .action(async (amount, options) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(async () => {
                // Parse the input amount
                const token = server_1.CMTSToken.parse(amount);
                // Determine the target unit
                let targetUnit;
                if (options.unit.toUpperCase() === 'CMTS') {
                    targetUnit = server_1.TokenUnit.TOKEN;
                }
                else if (options.unit.toUpperCase() === 'ATOMIC') {
                    targetUnit = server_1.TokenUnit.ATOMIC;
                }
                else {
                    throw new Error(`Unsupported unit: ${options.unit}. Only CMTS and ATOMIC are supported.`);
                }
                // Convert and display the result
                const result = token.toString(targetUnit);
                console.log(result);
            });
        });
    }
}
exports.ConvertTokenCommand = ConvertTokenCommand;
