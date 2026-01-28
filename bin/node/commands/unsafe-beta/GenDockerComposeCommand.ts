import commander from "commander";
import {SafeCommandRunner} from "../safeCommandRunner";
import {FileDownloader} from "../../utils/FileDownloader";
import path from "node:path";

export class GenDockerComposeCommand {
    static register(program: commander.Command) {
        program
            .command('gen-docker-compose')
            .description('Download the docker-compose file for the node')
            .action(async () => {
                await SafeCommandRunner.safeRun(async () => {
                    const dockerComposePath = path.resolve('.', 'docker-compose.yml');
                    
                    await FileDownloader.downloadAt(
                        "https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/node/docker-compose-with-caddy.yml",
                        dockerComposePath
                    );
                    
                    console.log('Docker-compose file downloaded successfully at docker-compose.yml');
                });
            });
    }
}
