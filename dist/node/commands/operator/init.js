"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorInitCommand = void 0;
const OperatorConfigGenerator_1 = require("../../services/operator/OperatorConfigGenerator");
const prompts_1 = require("@inquirer/prompts");
const EndpointTransformer_1 = require("../../utils/EndpointTransformer");
const safeCommandRunner_1 = require("../safeCommandRunner");
const node_crypto_1 = require("node:crypto");
class OperatorInitCommand {
    register(program) {
        program
            .command('init-config')
            .description('Create a new operator configuration')
            .option('--home <home>', 'Path to create the configuration', '.')
            .option('--workspace-domain-name <workspace-domain-name>', "Domain name of the workspace")
            .option('--operator-domain-name <operator-domain-name>', "Domain name of the operator")
            .option('--node-url <node-url>', "Url of the node used by the operator to interact with the chain")
            .action(async (options) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(async () => {
                // asks for missing information
                const params = await this.generateOperatorConfigGeneratorParams(options);
                const generator = new OperatorConfigGenerator_1.OperatorConfigGenerator(params);
                await generator.generateConfig();
            });
        });
    }
    async generateOperatorConfigGeneratorParams(options) {
        const config = {
            nodeUrl: await this.askNodeUrl(options.nodeUrl),
            allowEncryptionKeyGeneration: true,
            downloadEndpoints: {
                dockerCompose: 'https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/operator/docker-compose-with-caddy.yml',
                caddyfile: 'https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/operator/Caddyfile'
            },
            domainNames: {
                operator: await this.askOperatorDomainName(options.operatorDomainName),
                workspace: await this.askWorkspaceDomainName(options.workspaceDomainName)
            },
            database: {
                database: "operator",
                password: this.generateDatabasePassword(),
                useDockerSecret: false,
                port: 5432,
                type: "postgresql",
                url: "operator-db",
                user: "postgres"
            },
            generateAt: options.home,
            operatorHome: '/operator' // Docker-specific,
        };
        return config;
    }
    askNodeUrl(providedNodeUrl) {
        return providedNodeUrl || (0, prompts_1.input)({
            message: 'Enter the node RPC endpoint used by the operator to interact with the chain',
            validate: (value) => new EndpointTransformer_1.EndpointTransformer(value).isHttpOrHttpsEndpoint(),
        });
    }
    generateDatabasePassword() {
        return (0, node_crypto_1.randomBytes)(32).toString("hex");
    }
    async askWorkspaceDomainName(providedDomainName) {
        return providedDomainName || (0, prompts_1.input)({
            message: 'Enter the domain name of the workspace',
        });
    }
    async askOperatorDomainName(providedDomainName) {
        return providedDomainName || (0, prompts_1.input)({
            message: 'Enter the domain name of the operator',
        });
    }
}
exports.OperatorInitCommand = OperatorInitCommand;
