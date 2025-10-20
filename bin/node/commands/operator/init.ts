import commander from "commander";
import {OperatorConfigGenerator, OperatorInitParams} from "../../services/operator/OperatorConfigGenerator";
import {input} from "@inquirer/prompts";
import {EndpointTransformer} from "../../utils/EndpointTransformer";
import {SafeCommandRunner} from "../safeCommandRunner";
import {randomBytes} from "node:crypto";

export class OperatorInitCommand {
    register(program: commander.Command) {
        program
            .command('init-config')
            .description('Create a new operator configuration')
            .option('--home <home>', 'Path to create the configuration', '.')
            .option('--workspace-domain-name <workspace-domain-name>', "Domain name of the workspace")
            .option('--operator-domain-name <operator-domain-name>', "Domain name of the operator")
            .option('--node-url <node-url>', "Url of the node used by the operator to interact with the chain")
            .action(async (options) => {
                await SafeCommandRunner.safeRun(async () => {
                    // asks for missing information
                    const params = await this.generateOperatorConfigGeneratorParams(options);
                    const generator = new OperatorConfigGenerator(params);
                    await generator.generateConfig();
                })
            })
        ;
    }

    private async generateOperatorConfigGeneratorParams(options: any) {
        const config: OperatorInitParams = {
            nodeUrl: await this.askNodeUrl(options.nodeUrl),
            allowEncryptionKeyGeneration: true,
            downloadEndpoints:  {
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
        }
        return config;
    }

    private askNodeUrl(providedNodeUrl?: string) {
        return providedNodeUrl || input({
            message: 'Enter the node RPC endpoint used by the operator to interact with the chain',
            validate: (value: string) => new EndpointTransformer(value).isHttpOrHttpsEndpoint(),
        })
    }

    private generateDatabasePassword() {
        return randomBytes(32).toString("hex");
    }

    private async askWorkspaceDomainName(providedDomainName?: string) {
        return providedDomainName || input({
            message: 'Enter the domain name of the workspace',
        })
    }

    private async askOperatorDomainName(providedDomainName?: string) {
        return providedDomainName || input({
            message: 'Enter the domain name of the operator',
        })
    }
}