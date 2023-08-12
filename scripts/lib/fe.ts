import { execFile } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

// Requirements: fe installed as binary in $PATH
export interface ContractArtifactInfo {
    binHex: string
    binPath: string
    abi: object
    abiPath: string
}

/// Build fe project
/// > fe build contracts-fe --output-dir artifacts/fe
export async function build(): Promise<Record<string, ContractArtifactInfo>> {
    const cwd = path.resolve(__dirname, '../..')
    return new Promise(async (resolve, reject) => {
        const fe = execFile(
            'fe',
            ['build', 'contracts-fe', '--output-dir', 'artifacts-fe', '--overwrite'],
            {
                encoding: 'utf-8',
                cwd,
            }
        )
        fe.on('exit', async (code) => {
            if (!code) {
                const artifactsDir = path.resolve(cwd, 'artifacts-fe')
                const dirs = await fs.readdir(artifactsDir, {
                    withFileTypes: true,
                    recursive: false,
                })
                const contracts: Record<string, ContractArtifactInfo> = {}
                for (const dir of dirs) {
                    if (!dir.isDirectory()) continue
                    const contractName = dir.name
                    const files = await fs.readdir(path.resolve(artifactsDir, contractName), {
                        withFileTypes: true,
                    })
                    const bin = files.find((file) => file.isFile() && file.name.endsWith('.bin'))
                    const abi = files.find(
                        (file) => file.isFile() && file.name.endsWith('_abi.json')
                    )
                    if (!bin || !abi) {
                        reject(new Error(`bin or abi not found for artifact "${contractName}"`))
                        return
                    }
                    const binPath = path.resolve(artifactsDir, contractName, bin.name)
                    const abiPath = path.resolve(artifactsDir, contractName, abi.name)
                    contracts[contractName] = {
                        binHex: await fs
                            .readFile(binPath, { encoding: 'utf-8' })
                            .then((buf) => `0x${buf}`),
                        binPath,
                        abi: JSON.parse(await fs.readFile(abiPath, { encoding: 'utf-8' })),
                        abiPath,
                    }
                }

                resolve(contracts)
            } else {
                reject(new Error(`fe aborted with code: ${code}`))
            }
        })
        let stderr = ''
        fe.stderr
            ?.on('data', (chunk) => {
                stderr += chunk
            })
            .on('close', () => {
                console.error(stderr)
            })
        let stdout = ''
        fe.stdout
            ?.on('data', (chunk) => {
                stdout += chunk
            })
            .on('close', () => {
                console.log(stdout)
            })
    })
}
