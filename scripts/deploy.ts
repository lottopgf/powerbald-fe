import { AbiCoder, Contract, Interface, ZeroAddress, parseEther, parseUnits } from 'ethers'
import { ethers } from 'hardhat'
import assert from 'assert'
import { chainlinkVRFV2Configs } from './configs'
import { ChainlinkVRFV2Randomiser__factory } from '../typechain-types'
import { ContractArtifactInfo, build } from './lib/fe'
import { deployPowerball } from './lib/deployPowerball'

const BALL_DOMAIN = 10
const GAME_DURATION = 60n * 60n /** 1h */
const ENTRY_PRICE = parseEther('0.001') /** 2 bucks */
const FEE_RECIPIENT = '0x62e3e40A0231fe62a4Cea97FfAF2be6C605012Ce'

async function main() {
    const { chainId } = await ethers.provider.getNetwork()
    assert(chainId === 0xa4b1n, 'Unexpected chainid')
    const [deployer] = await ethers.getSigners()

    // Deploy randomiser
    const chainlinkVRFV2RandomiserConstructorArgs: [
        string,
        string,
        bigint,
        string,
        bigint,
        bigint,
        bigint
    ] = [
        chainlinkVRFV2Configs[0xa4b1].vrfCoordinator,
        chainlinkVRFV2Configs[0xa4b1].linkTokenAddress,
        chainlinkVRFV2Configs[0xa4b1].linkPremium,
        chainlinkVRFV2Configs[0xa4b1].gasLaneKeyHash30Gwei,
        parseUnits('30', 'gwei'),
        1_000_000n,
        84n,
    ]
    const randomiser = await new ChainlinkVRFV2Randomiser__factory(deployer).deploy(
        ...chainlinkVRFV2RandomiserConstructorArgs
    )
    await randomiser.waitForDeployment()
    console.log(`Deployed new ChainlinkVRFV2Randomiser: ${await randomiser.getAddress()}`)

    // Build Fe contracts
    let feArtifacts: Record<string, ContractArtifactInfo>
    feArtifacts = await build()

    // Deploy Fe contracts
    const powerball = await deployPowerball(deployer, {
        randomiser: await randomiser.getAddress(),
        ballDomain: BALL_DOMAIN,
        gameDuration: GAME_DURATION,
        entryPrice: ENTRY_PRICE,
        feeRecipient: FEE_RECIPIENT,
    })
    await powerball.waitForDeployment()
    console.log(`Deployed Powerball to ${await powerball.getAddress()}`)
    // Sanity
    assert(
        (await powerball.randomiser()) === (await randomiser.getAddress()),
        'Randomiser not set correctly'
    )

    // Authorise contract to call VRF
    await randomiser.authorise(await powerball.getAddress(), true)
    console.log(`Authorised ${await powerball.getAddress()} as ChainlinkVRFV2Randomiser operator`)
}

main()
    .then(() => {
        console.log('Done')
    })
    .catch((err) => {
        console.error(err)
    })
