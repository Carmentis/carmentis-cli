import commander from "commander";
import {SafeCommandRunner} from "./safeCommandRunner";

export class CometBFTCommand {
    constructor() {
    }

    register(program: commander.Command) {
        const docker = program
            .command('cometbft')
            .description('CometBFT utility commande');

        docker
            .command("sign")
            .arguments('<keyPath>')
            .arguments('<message>')
            .action(async () => {
                await SafeCommandRunner.safeRun(async () => {

                });
            });

        docker.command("verify")
            .description("Verify a signed message")
            .action(async () => {
                await SafeCommandRunner.safeRun(async () => {

                });
            });

    }
}
