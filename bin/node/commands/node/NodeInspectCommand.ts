import commander from "commander";
import {SafeCommandRunner} from "../safeCommandRunner";
import {execSync} from "child_process";

export class NodeInspectCommand {
    static register(program: commander.Command) {
        program
            .command('inspect')
            .description('Display information about the running node and cometbft versions')
            .action(async (options) =>  {
                await SafeCommandRunner.safeRun(async () => {
                    console.log('🔍 Inspecting running containers...\n');

                    // check node-abci container
                    let nodeAbciInfo = NodeInspectCommand.getContainerInfo('carmentis-node-abci');

                    if (nodeAbciInfo) {
                        console.log('📦 Node ABCI:');
                        console.log(`   Container: ${nodeAbciInfo.container}`);
                        console.log(`   Image:     ${nodeAbciInfo.image}`);
                        console.log(`   Tag:       ${nodeAbciInfo.tag}`);
                        console.log(`   Status:    ${nodeAbciInfo.status}`);
                    } else {
                        console.log('📦 Node ABCI:');
                        console.log('   Status:    Not running');
                    }

                    console.log('');

                    // check cometbft container
                    let cometbftInfo = NodeInspectCommand.getContainerInfo('carmentis-node-cometbft');

                    if (cometbftInfo) {
                        console.log('📦 CometBFT:');
                        console.log(`   Container: ${cometbftInfo.container}`);
                        console.log(`   Image:     ${cometbftInfo.image}`);
                        console.log(`   Tag:       ${cometbftInfo.tag}`);
                        console.log(`   Status:    ${cometbftInfo.status}`);
                    } else {
                        console.log('📦 CometBFT:');
                        console.log('   Status:    Not running');
                    }
                })
            })
    }

    private static getContainerInfo(containerName: string): {
        container: string,
        image: string,
        tag: string,
        status: string
    } | null {
        try {
            // get container image and status
            const inspectOutput = execSync(
                `docker inspect ${containerName} --format='{{.Config.Image}}|||{{.State.Status}}'`,
                { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
            ).trim();

            if (!inspectOutput) {
                return null;
            }

            const [imageWithTag, status] = inspectOutput.split('|||');

            // parse image and tag
            let image: string;
            let tag: string;

            if (imageWithTag.includes(':')) {
                const lastColonIndex = imageWithTag.lastIndexOf(':');
                image = imageWithTag.substring(0, lastColonIndex);
                tag = imageWithTag.substring(lastColonIndex + 1);
            } else {
                image = imageWithTag;
                tag = 'latest';
            }

            return {
                container: containerName,
                image: image,
                tag: tag,
                status: status
            };
        } catch (error) {
            return null;
        }
    }
}
