"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorConfigParamsResolver = void 0;
const prompts_1 = require("@inquirer/prompts");
const EndpointTransformer_1 = require("../../utils/EndpointTransformer");
const node_crypto_1 = require("node:crypto");
class OperatorConfigParamsResolver {
    /**
     * This method is used to convert the provided initial inputs (obtained by command line arguments) and to complete
     * the params.
     * @param options
     */
    static async resolveParams(options) {
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
            operatorHome: '/operator', // Docker-specific,
            filenames: {
                operatorConfigFilename: 'config.toml'
            },
            shouldDownload: {
                dockerCompose: true,
                caddyfile: true
            }
        };
        return config;
    }
    static askNodeUrl(providedNodeUrl) {
        return providedNodeUrl || (0, prompts_1.input)({
            message: 'Enter the node RPC endpoint used by the operator to interact with the chain',
            validate: (value) => new EndpointTransformer_1.EndpointTransformer(value).isHttpOrHttpsEndpoint(),
        });
    }
    static generateDatabasePassword() {
        return (0, node_crypto_1.randomBytes)(32).toString("hex");
    }
    static async askWorkspaceDomainName(providedDomainName) {
        return providedDomainName || (0, prompts_1.input)({
            message: 'Enter the domain name of the workspace',
        });
    }
    static async askOperatorDomainName(providedDomainName) {
        return providedDomainName || (0, prompts_1.input)({
            message: 'Enter the domain name of the operator',
        });
    }
}
exports.OperatorConfigParamsResolver = OperatorConfigParamsResolver;
