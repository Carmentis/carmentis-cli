import {NetworksStore} from "../services/networksStore";
import commander from "commander";
import {SafeCommandRunner} from "./safeCommandRunner";
import {DockerBinary} from "../services/dockerBinary";

export class DockerCommand {
    constructor() {
    }

    register(program: commander.Command) {
        const docker = program
            .command('docker')
            .description('Docker utility');

        docker.command("down")
            .action(async () => {
                await SafeCommandRunner.safeRun(async () => await DockerBinary.runComposeDown());
            });

        docker.command("up")
            .action(async () => {
                await SafeCommandRunner.safeRun(async () => await DockerBinary.runComposeUp());
            });

        docker.command("logs")
            .action(async () => {
                await SafeCommandRunner.safeRun(async () => await DockerBinary.runComposeLogs());
            });
    }
}
