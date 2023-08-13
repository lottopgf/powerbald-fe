import { AbiCoder, Contract, Interface, ZeroAddress, parseEther, parseUnits } from 'ethers'
import { ethers } from 'hardhat'
import assert from 'assert'
import { ContractArtifactInfo, build } from './lib/fe'
import { ChainlinkVRFV2Randomiser__factory } from '../typechain-types'

async function main() {
    const { chainId } = await ethers.provider.getNetwork()
    assert(chainId === 0xa4b1n, 'Unexpected chainid')
    const [deployer] = await ethers.getSigners()

    const randomiser = ChainlinkVRFV2Randomiser__factory.connect(
        '0x6C42a668a0682737c091321545dE2f184B1bB146',
        deployer
    )
    await randomiser.waitForDeployment()
    console.log(`Deployed new ChainlinkVRFV2Randomiser: ${await randomiser.getAddress()}`)

    // Build Fe contracts
    let feArtifacts: Record<string, ContractArtifactInfo>
    feArtifacts = await build()

    // Deploy Fe contracts
    const powerball = new Contract(
        '0x328f4936B31bd26390b1be60C9CFeC0047062752',
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

    console.log(await powerball.game_finalised(0))

    // const tx = await powerball
    //     .draw({
    //         gasLimit: 1_000_000,
    //     })
    //     .then((tx) => tx.wait(1))
    // console.log(tx)
}

main()
    .then(() => {
        console.log('Done')
    })
    .catch((err) => {
        console.error(err)
    })
