import { ethers } from 'hardhat'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { ContractArtifactInfo, build } from '../scripts/lib/fe'
import {
    BytecodeDeployer,
    BytecodeDeployer__factory,
    MockChainlinkVRFV2Randomiser,
} from '../typechain-types'
import { AbiCoder, Contract, Interface, solidityPacked } from 'ethers'
import { expect } from 'chai'
import { MockChainlinkVRFV2Randomiser__factory } from '../typechain-types/factories/contracts/test'

describe('Powerball', () => {
    let feArtifacts: Record<string, ContractArtifactInfo>
    before(async () => {
        // Build fe contract
        feArtifacts = await build()
    })

    let deployer: SignerWithAddress
    let bytecodeDeployer: BytecodeDeployer
    let powerball: Contract
    let mockRandomiser: MockChainlinkVRFV2Randomiser
    beforeEach(async () => {
        ;[deployer] = await ethers.getSigners()

        // mocks
        mockRandomiser = await new MockChainlinkVRFV2Randomiser__factory(deployer).deploy()

        // Deploy deployer
        bytecodeDeployer = await new BytecodeDeployer__factory(deployer).deploy()
        // Deploy Fe contracts
        const args = AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint8', 'uint256'],
            [
                await mockRandomiser.getAddress() /** randomiser */,
                69 /** ball_domain */,
                3600 /** game duration =1h */,
            ]
        )
        const tx = await bytecodeDeployer
            .deployBytecode(feArtifacts.Powerball.binHex, args)
            .then((tx) => tx.wait(1))
        const { destination: deployedAddress } =
            BytecodeDeployer__factory.createInterface().decodeEventLog(
                'ContractDeployed',
                tx!.logs[0].data,
                tx!.logs[0].topics
            )
        powerball = await new Contract(
            deployedAddress,
            new Interface(feArtifacts.Powerball.abi as any),
            deployer
        )
        expect(await powerball.randomiser()).to.eq(await mockRandomiser.getAddress())
    })

    it('accept valid picks', async () => {
        expect(await powerball.games_count()).to.eq(1)
        const picks = solidityPacked(
            ['uint8', 'uint8', 'uint8', 'uint8', 'uint8'],
            [0, 20, 12, 68, 54]
        )
        await powerball.enter(picks)
        expect(await powerball.entries_count(1)).to.eq(1)
    })

    it('rejects invalid picks', async () => {
        const picks = solidityPacked(
            ['uint8', 'uint8', 'uint8', 'uint8', 'uint8'],
            [0, 20, 12, 69 /** too high */, 54]
        )
        await expect(powerball.enter(picks)).to.be.reverted
    })

    it('interacts with vrf', async () => {
        // Entry
        const picks = solidityPacked(
            ['uint8', 'uint8', 'uint8', 'uint8', 'uint8'],
            [0, 20, 12, 68, 54]
        )
        await powerball.enter(picks)

        const requestId = await mockRandomiser.nextRequestId()
        const gameNum = await powerball.games_count()
        // Draw
        await time.increase(3601)
        await powerball.draw()
        await mockRandomiser.fulfillRandomWords(requestId, [69420])
        expect(await powerball.game_seed(gameNum)).to.eq(69420)
    })

    it('rejects draw if not time yet', async () => {
        const picks = solidityPacked(
            ['uint8', 'uint8', 'uint8', 'uint8', 'uint8'],
            [0, 20, 12, 68, 54]
        )
        await powerball.enter(picks)
        // Fail to draw
        await expect(powerball.draw()).to.be.reverted
    })
})
