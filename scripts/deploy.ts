import { AbiCoder, Contract, Interface, ZeroAddress, parseEther, parseUnits } from 'ethers'
import { ethers } from 'hardhat'
import assert from 'assert'
import { chainlinkVRFV2Configs } from './configs'
import { ChainlinkVRFV2Randomiser__factory } from '../typechain-types'
import { ContractArtifactInfo, build } from './lib/fe'

const BALL_DOMAIN = 6
const GAME_DURATION = 5 * 60 /** 5 mins */
const ENTRY_PRICE = 2 /** 2 wei */
const FEE_RECIPIENT = ZeroAddress /** burn address */

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
        42n,
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
    const args = AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint8', 'uint256', 'uint256', 'address'],
        [await randomiser.getAddress(), BALL_DOMAIN, GAME_DURATION, ENTRY_PRICE, FEE_RECIPIENT]
    )
    const tx = await deployer
        .sendTransaction({
            data: ethers.concat([feArtifacts.Powerball.binHex, args]),
        })
        .then((tx) => tx.wait(1))
    const powerball = new Contract(
        tx!.contractAddress!,
        new Interface(feArtifacts.Powerball.abi as any),
        deployer
    )
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
