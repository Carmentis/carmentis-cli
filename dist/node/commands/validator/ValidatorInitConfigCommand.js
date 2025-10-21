"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorInitConfigCommand = void 0;
const safeCommandRunner_1 = require("../safeCommandRunner");
const OperatorConfigParamsResolver_1 = require("../../services/operator/OperatorConfigParamsResolver");
const OperatorConfigGenerator_1 = require("../../services/operator/OperatorConfigGenerator");
const NodeConfigParamsResolver_1 = require("../../services/node/NodeConfigParamsResolver");
const dockerBinary_1 = require("../../utils/dockerBinary");
const OperatorInitConfigCommand_1 = require("../operator/OperatorInitConfigCommand");
const NodeInitConfigCommand_1 = require("../node/NodeInitConfigCommand");
const NodeConfigGenerator_1 = require("../../services/node/NodeConfigGenerator");
const FileDownloader_1 = require("../../utils/FileDownloader");
const path_1 = require("path");
const FileManager_1 = require("../../utils/FileManager");
class ValidatorInitConfigCommand {
    static register(program) {
        program = program
            .command('init-config')
            .description('Create a new validator (single-package node/operator) configuration')
            .option('--home <home>', 'Path to create the configuration', '.');
        OperatorInitConfigCommand_1.OperatorInitCommand.registerOptions(program);
        NodeInitConfigCommand_1.NodeInitConfigCommand.registerOptions(program);
        program
            .action(async (options) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(async () => {
                // ensure binaries are installed
                const areAllBinariesInstalled = dockerBinary_1.DockerBinary.isDockerInstalled();
                if (!areAllBinariesInstalled) {
                    console.error('Please, ensure docker is installed before to proceed.');
                    return;
                }
                // asks for missing information
                const operatorParams = await OperatorConfigParamsResolver_1.OperatorConfigParamsResolver.resolveParams(options);
                const nodeParams = await NodeConfigParamsResolver_1.NodeConfigParamsResolver.resolveParams(options);
                // we do not want the Caddyfiles and the docker-compose
                operatorParams.shouldDownload = { dockerCompose: false, caddyfile: false };
                nodeParams.shouldDownload = { dockerCompose: false, caddyFile: false };
                // we change the TOML config filenames to avoid collision (initially, both files have the same name)
                operatorParams.filenames.operatorConfigFilename = "operator-config.toml";
                nodeParams.abciConfig.nodeConfigFilename = 'abci-config.toml';
                // generate the validator config
                const operatorConfigGenerator = new OperatorConfigGenerator_1.OperatorConfigGenerator(operatorParams);
                const nodeConfigGenerator = new NodeConfigGenerator_1.NodeConfigGenerator(nodeParams);
                await nodeConfigGenerator.generateConfig();
                await operatorConfigGenerator.generateConfig();
                // download the Caddyfile and docker-compose.yml
                const homePath = (0, path_1.resolve)(options.home);
                const cadddyFilePath = (0, path_1.join)(homePath, 'Caddyfile');
                const dockerComposePath = (0, path_1.join)(homePath, 'docker-compose.yml');
                await FileDownloader_1.FileDownloader.downloadAt(this.VALIDATOR_DOCKER_COMPOSE, dockerComposePath);
                await FileDownloader_1.FileDownloader.downloadAt(this.VALIDATOR_CADDYFILE, cadddyFilePath);
                // we update the caddyfile
                await FileManager_1.FileManager.replaceInFile(cadddyFilePath, "node.your-domain-name", nodeParams.abciConfig.exposedRpcDomainName);
                await FileManager_1.FileManager.replaceInFile(cadddyFilePath, "operator.your-domain-name", operatorParams.domainNames.operator);
                await FileManager_1.FileManager.replaceInFile(cadddyFilePath, "workspace.your-domain-name", operatorParams.domainNames.workspace);
                // show the result message
                const home = options.home;
                console.log(`Congrats, your node configuration has been created at ${home}!`);
            });
        });
    }
}
exports.ValidatorInitConfigCommand = ValidatorInitConfigCommand;
ValidatorInitConfigCommand.VALIDATOR_DOCKER_COMPOSE = "https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/validator/docker-compose-node-testnet-operator-stable.yml";
ValidatorInitConfigCommand.VALIDATOR_CADDYFILE = "https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/validator/Caddyfile";
