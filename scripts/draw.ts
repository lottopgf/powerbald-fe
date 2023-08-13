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
        '0x3Fb39835D34Dff0cA72CE8346E878a466AEA54De',
        deployer
    )
    await randomiser.waitForDeployment()
    console.log(`Deployed new ChainlinkVRFV2Randomiser: ${await randomiser.getAddress()}`)

    // Build Fe contracts
    let feArtifacts: Record<string, ContractArtifactInfo>
    feArtifacts = await build()

    // Deploy Fe contracts
    const powerball = new Contract(
        '0x1996d7f83a904a258D2F9A215c674ABFffF7dBC9',
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
