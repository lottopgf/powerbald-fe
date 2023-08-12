import { ethers } from 'hardhat'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { ContractArtifactInfo, build } from '../scripts/lib/fe'
import { MockChainlinkVRFV2Randomiser } from '../typechain-types'
import { AbiCoder, Contract, Interface, parseEther, solidityPacked } from 'ethers'
import { expect } from 'chai'
import { MockChainlinkVRFV2Randomiser__factory } from '../typechain-types/factories/contracts/test'

describe('Powerball', () => {
    let feArtifacts: Record<string, ContractArtifactInfo>
    before(async () => {
        // Build fe contract
        feArtifacts = await build()
    })

    let deployer: SignerWithAddress
    let powerball: Contract
    let mockRandomiser: MockChainlinkVRFV2Randomiser
    let feeRecipient: string
    beforeEach(async () => {
        ;[deployer] = await ethers.getSigners()
        feeRecipient = ethers.getAddress(ethers.hexlify(ethers.randomBytes(20)))

        // mocks
        mockRandomiser = await new MockChainlinkVRFV2Randomiser__factory(deployer).deploy()

        // Deploy Fe contracts
        const args = AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint8', 'uint256', 'uint256', 'address'],
            [
                await mockRandomiser.getAddress() /** randomiser */,
                69 /** ball_domain */,
                3600 /** game duration =1h */,
                parseEther('1') /** entry price */,
                feeRecipient,
            ]
        )
        const tx = await deployer
            .sendTransaction({
                data: ethers.concat([feArtifacts.Powerball.binHex, args]),
            })
            .then((tx) => tx.wait(1))
        powerball = await new Contract(
            tx!.contractAddress!,
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
        await powerball.enter(picks, {
            value: parseEther('1'),
        })
        expect(await powerball.entries_count(1)).to.eq(1)
        expect(await ethers.provider.getBalance(feeRecipient)).to.eq(parseEther('0.5'))

        await powerball.enter(
            solidityPacked(['uint8', 'uint8', 'uint8', 'uint8', 'uint8'], [0, 20, 12, 68, 54]),
            {
                value: parseEther('1'),
            }
        )
        expect(await powerball.entries_count(1)).to.eq(2)
    })

    it('rejects invalid picks', async () => {
        const picks = solidityPacked(
            ['uint8', 'uint8', 'uint8', 'uint8', 'uint8'],
            [0, 20, 12, 69 /** too high */, 54]
        )
        await expect(
            powerball.enter(picks, {
                value: parseEther('1'),
            })
        ).to.be.reverted
    })

    it('interacts with vrf', async () => {
        // Entry
        const picks = solidityPacked(
            ['uint8', 'uint8', 'uint8', 'uint8', 'uint8'],
            [0, 20, 12, 68, 54]
        )
        await powerball.enter(picks, {
            value: parseEther('1'),
        })

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
        await powerball.enter(picks, {
            value: parseEther('1'),
        })
        // Fail to draw
        await expect(powerball.draw()).to.be.reverted
    })
})
