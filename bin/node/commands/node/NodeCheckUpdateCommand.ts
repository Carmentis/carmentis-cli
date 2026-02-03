import commander from "commander";
import {SafeCommandRunner} from "../safeCommandRunner";
import {Binary} from "../../utils/Binary";
import {execSync} from "child_process";
import path from "node:path";
import fs from "node:fs";

export class NodeCheckUpdateCommand {
    static register(program: commander.Command) {
        program
            .command('check-update')
            .description('Check if a new version of the node-abci image is available')
            .option('--home <home>', 'Path where the docker-compose.yml file is located', '.')
            .action(async (options) =>  {
                await SafeCommandRunner.safeRun(async () => {
                    const homePath = path.resolve(options.home);
                    const dockerComposePath = path.join(homePath, 'docker-compose.yml');

                    // check if docker-compose.yml exists
                    if (!fs.existsSync(dockerComposePath)) {
                        console.error(`docker-compose.yml not found at ${dockerComposePath}`);
                        return;
                    }

                    // parse docker-compose.yml to get the image name and tag
                    const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');

                    // extract image reference using regex (simple parser for our use case)
                    const nodeAbciServiceMatch = dockerComposeContent.match(/node-abci:[\s\S]*?image:\s*(.+)/);
                    if (!nodeAbciServiceMatch || !nodeAbciServiceMatch[1]) {
                        console.error('node-abci service or image not found in docker-compose.yml');
                        return;
                    }

                    const imageRef = nodeAbciServiceMatch[1].trim();
                    console.log(`📦 Image reference from docker-compose.yml: ${imageRef}`);

                    // try to get SHA256 from running container first
                    let currentSha256: string | null = null;
                    let source: string = '';

                    try {
                        const containerInspect = execSync(
                            `docker inspect carmentis-node-abci --format='{{.Image}}'`,
                            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
                        ).trim();

                        if (containerInspect && containerInspect.startsWith('sha256:')) {
                            currentSha256 = containerInspect;
                            source = 'running container';
                        }
                    } catch (error) {
                        // container not running, continue to check image
                    }

                    // if no running container, check if image exists locally
                    if (!currentSha256) {
                        try {
                            const imageInspect = execSync(
                                `docker inspect ${imageRef} --format='{{.Id}}'`,
                                { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
                            ).trim();

                            if (imageInspect && imageInspect.startsWith('sha256:')) {
                                currentSha256 = imageInspect;
                                source = 'local image';
                            }
                        } catch (error) {
                            console.error(`❌ No running container or local image found for ${imageRef}`);
                            console.log('Please pull the image first with: docker compose pull node-abci');
                            return;
                        }
                    }

                    console.log(`📍 Current SHA256 (from ${source}): ${currentSha256}`);

                    // get the latest SHA256 from remote registry
                    console.log('🔍 Checking latest version from remote registry...');

                    let manifestJson: string;
                    try {
                        manifestJson = execSync(
                            `docker manifest inspect ${imageRef}`,
                            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
                        );
                    } catch (error) {
                        console.error(`❌ Failed to fetch manifest for ${imageRef}`);
                        console.error('Make sure you have network access and the image exists in the registry');
                        return;
                    }

                    const manifest = JSON.parse(manifestJson);

                    // get digest from manifest
                    let latestDigest: string | null = null;

                    if (manifest.manifests && Array.isArray(manifest.manifests) && manifest.manifests.length > 0) {
                        // multi-arch manifest
                        latestDigest = manifest.manifests[0].digest;
                    } else if (manifest.config && manifest.config.digest) {
                        // single manifest
                        latestDigest = manifest.config.digest;
                    }

                    if (!latestDigest) {
                        console.error('❌ Could not extract digest from manifest');
                        return;
                    }

                    console.log(`📍 Latest SHA256 (from registry): ${latestDigest}`);

                    // this should never happen due to earlier checks, but TypeScript needs explicit null check
                    if (!currentSha256) {
                        console.error('❌ Could not retrieve current SHA256');
                        return;
                    }

                    // compare versions
                    const currentShort = currentSha256.replace('sha256:', '').substring(0, 12);
                    const latestShort = latestDigest.replace('sha256:', '').substring(0, 12);

                    console.log('\n📊 Comparison:');
                    console.log(`   Current: ${currentShort}`);
                    console.log(`   Latest:  ${latestShort}`);

                    // note: we need to pull and inspect the remote image to get its exact ID
                    // for now, we just check if the digests are different
                    if (currentSha256.includes(latestDigest.replace('sha256:', '')) ||
                        latestDigest.includes(currentSha256.replace('sha256:', ''))) {
                        console.log('\n✅ Your node-abci image is up to date!');
                    } else {
                        console.log('\n⚠️  A different version is available in the registry');
                        console.log('   Run "docker compose pull node-abci" to update');
                    }
                })
            })
    }
}
