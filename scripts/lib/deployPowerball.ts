import { ethers } from 'hardhat'
import { ContractArtifactInfo, build } from './fe'
import { AbiCoder, Contract, Interface, Signer } from 'ethers'

let feArtifacts: Record<string, ContractArtifactInfo>
export async function deployPowerball(
    deployer: Signer,
    {
        randomiser,
        ballDomain,
        gameDuration,
        entryPrice,
        feeRecipient,
    }: {
        randomiser: string
        ballDomain: number
        gameDuration: bigint
        entryPrice: bigint
        feeRecipient: string
    }
) {
    if (!feArtifacts) feArtifacts = await build()

    const args = AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint8', 'uint256', 'uint256', 'address'],
        [randomiser, ballDomain, gameDuration, entryPrice, feeRecipient]
    )
    const tx = await deployer
        .sendTransaction({
            data: ethers.concat([feArtifacts.Powerball.binHex, args]),
        })
        .then((tx) => tx.wait(1))
    return new Contract(
        tx!.contractAddress!,
        new Interface(feArtifacts.Powerball.abi as any),
        deployer
    )
}
