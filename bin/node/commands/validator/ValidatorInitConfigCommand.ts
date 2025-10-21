import commander from "commander";
import {SafeCommandRunner} from "../safeCommandRunner";
import {OperatorConfigParamsResolver} from "../../services/operator/OperatorConfigParamsResolver";
import {OperatorConfigGenerator} from "../../services/operator/OperatorConfigGenerator";
import {NodeConfigParamsResolver} from "../../services/node/NodeConfigParamsResolver";
import {DockerBinary} from "../../utils/dockerBinary";
import {OperatorInitCommand} from "../operator/OperatorInitConfigCommand";
import {NodeInitConfigCommand} from "../node/NodeInitConfigCommand";
import {NodeConfigGenerator} from "../../services/node/NodeConfigGenerator";
import {FileDownloader} from "../../utils/FileDownloader";
import {join, resolve} from "path";
import {FileManager} from "../../utils/FileManager";

export class ValidatorInitConfigCommand {
    private static VALIDATOR_DOCKER_COMPOSE = "https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/validator/docker-compose-node-testnet-operator-stable.yml"
    private static VALIDATOR_CADDYFILE = "https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/validator/Caddyfile"
    static register(program: commander.Command) {
        program = program
            .command('init-config')
            .description('Create a new validator (single-package node/operator) configuration')
            .option('--home <home>', 'Path to create the configuration', '.');

        OperatorInitCommand.registerOptions(program);
        NodeInitConfigCommand.registerOptions(program);
        program
            .action(async (options) => {
                await SafeCommandRunner.safeRun(async () => {
                    // ensure binaries are installed
                    const areAllBinariesInstalled =
                        DockerBinary.isDockerInstalled();
                    if (!areAllBinariesInstalled) {
                        console.error(
                            'Please, ensure docker is installed before to proceed.',
                        );
                        return;
                    }

                    // asks for missing information
                    const operatorParams = await OperatorConfigParamsResolver.resolveParams(options);
                    const nodeParams = await NodeConfigParamsResolver.resolveParams(options);

                    // we do not want the Caddyfiles and the docker-compose
                    operatorParams.shouldDownload = { dockerCompose: false, caddyfile: false };
                    nodeParams.shouldDownload = { dockerCompose: false, caddyFile: false };

                    // we change the TOML config filenames to avoid collision (initially, both files have the same name)
                    operatorParams.filenames.operatorConfigFilename = "operator-config.toml";
                    nodeParams.abciConfig.nodeConfigFilename = 'abci-config.toml';

                    // generate the validator config
                    const operatorConfigGenerator = new OperatorConfigGenerator(operatorParams);
                    const nodeConfigGenerator = new NodeConfigGenerator(nodeParams);
                    await nodeConfigGenerator.generateConfig();
                    await operatorConfigGenerator.generateConfig();

                    // download the Caddyfile and docker-compose.yml
                    const homePath = resolve(options.home);
                    const cadddyFilePath = join(homePath, 'Caddyfile');
                    const dockerComposePath = join(homePath, 'docker-compose.yml');
                    await FileDownloader.downloadAt(this.VALIDATOR_DOCKER_COMPOSE, dockerComposePath);
                    await FileDownloader.downloadAt(this.VALIDATOR_CADDYFILE, cadddyFilePath);

                    // we update the caddyfile
                    await FileManager.replaceInFile(cadddyFilePath, "node.your-domain-name", nodeParams.abciConfig.exposedRpcDomainName);
                    await FileManager.replaceInFile(cadddyFilePath, "operator.your-domain-name", operatorParams.domainNames.operator);
                    await FileManager.replaceInFile(cadddyFilePath, "workspace.your-domain-name", operatorParams.domainNames.workspace);

                    // show the result message
                    const home = options.home;
                    console.log(`Congrats, your node configuration has been created at ${home}!`);
                })
            })
        ;
    }
}