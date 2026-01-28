import commander from "commander";
import {SafeCommandRunner} from "../safeCommandRunner";
import {CMTSToken, TokenUnit} from "@cmts-dev/carmentis-sdk/server";

export class ConvertTokenCommand {
    static register(program: commander.Command) {
        program
            .command('convert-token <amount>')
            .description('Convert token amount between different units')
            .option('--unit <unit>', 'Target unit (CMTS or ATOMIC)', 'CMTS')
            .action(async (amount: string, options) => {
                await SafeCommandRunner.safeRun(async () => {
                    // Parse the input amount
                    const token = CMTSToken.parse(amount);
                    
                    // Determine the target unit
                    let targetUnit: TokenUnit;
                    if (options.unit.toUpperCase() === 'CMTS') {
                        targetUnit = TokenUnit.TOKEN;
                    } else if (options.unit.toUpperCase() === 'ATOMIC') {
                        targetUnit = TokenUnit.ATOMIC;
                    } else {
                        throw new Error(`Unsupported unit: ${options.unit}. Only CMTS and ATOMIC are supported.`);
                    }
                    
                    // Convert and display the result
                    const result = token.toString(targetUnit);
                    console.log(result);
                });
            });
    }
}
