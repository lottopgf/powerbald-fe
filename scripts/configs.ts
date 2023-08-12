import { parseEther } from 'ethers'

export const chainlinkVRFV2Configs: Record<
    number,
    {
        linkTokenAddress: string
        vrfCoordinator: string
        gasLaneKeyHash2Gwei: string
        gasLaneKeyHash30Gwei: string
        gasLaneKeyHash150Gwei: string
        /** per-request premium in juels */
        linkPremium: bigint
        maxGasLimit: number
        feedETHUSD: string
        feedLINKUSD: string
        weth: string
        swapRouter: string
    }
> = {
    0xa4b1: {
        /** arbitrum one */
        linkTokenAddress: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
        vrfCoordinator: '0x41034678D6C633D8a95c75e1138A360a28bA15d1',
        gasLaneKeyHash2Gwei: '0x08ba8f62ff6c40a58877a106147661db43bc58dabfb814793847a839aa03367f',
        gasLaneKeyHash30Gwei: '0x72d2b016bb5b62912afea355ebf33b91319f828738b111b723b78696b9847b63',
        gasLaneKeyHash150Gwei: '0x68d24f9a037a649944964c2a1ebd0b2918f4a243d2a99701cc22b548cf2daff0',
        linkPremium: parseEther('0.005'),
        maxGasLimit: 2_500_000,
        feedETHUSD: '0x639fe6ab55c921f74e7fac1ee960c0b6293ba612',
        feedLINKUSD: '0x86e53cf1b870786351da77a57575e79cb55812cb',
        weth: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        swapRouter: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    },
}
