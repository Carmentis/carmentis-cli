import commander from "commander";
import {SafeCommandRunner} from "../safeCommandRunner";
import {AbciConfigGenerator} from "../../services/AbciConfigGenerator";
import path from "node:path";

export class GenAbciConfigCommand {
    static register(program: commander.Command) {
        program
            .command('gen-abci-config')
            .description('Generate an ABCI configuration file with default parameters')
            .action(async () => {
                await SafeCommandRunner.safeRun(async () => {
                    const homePath = path.resolve('.');
                    
                    const abciConfigGenerator = new AbciConfigGenerator({
                        home: homePath,
                        exposedRpcEndpoint: 'http://localhost:26657',
                        exposedRpcDomainName: 'localhost',
                        nodeConfigFilename: 'config.toml',
                        min_microblock_gas_price_in_atomics: 1,
                    });
                    
                    await abciConfigGenerator.generateConfig();
                    console.log('ABCI configuration file generated successfully at config.toml');
                });
            });
    }
}
