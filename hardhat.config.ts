import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-abi-exporter'

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.18',
        settings: {
            viaIR: false,
            optimizer: {
                enabled: true,
                runs: 1000,
                details: {
                    yul: false,
                },
            },
        },
    },
    networks: {
        hardhat: {
            forking: {
                enabled: true,
                url: process.env.ARB_ONE_URL as string,
                blockNumber: 120716450,
            },
            accounts: {
                count: 10,
            },
        },
        arb1: {
            chainId: 0xa4b1,
            url: process.env.ARB_ONE_URL as string,
            accounts: [process.env.MAINNET_PK as string],
        },
    },
    abiExporter: {
        path: './exported-abi',
        runOnCompile: true,
        clear: true,
        flat: true,
        spacing: 2,
        only: [],
    },
}

export default config
