import { encrypt } from '@kevincharm/gfc-fpe'
import { hexlify, randomBytes, solidityPackedKeccak256 } from 'ethers'
import fs from 'fs/promises'
import path from 'path'

// Feistel round function; should mimic implementation
const f = (R: bigint, i: bigint, seed: bigint, domain: bigint) =>
    BigInt(
        solidityPackedKeccak256(['uint256', 'uint256', 'uint256', 'uint256'], [R, i, seed, domain])
    )

// Output an fe test
;(() => {
    const testVectors: {
        input: bigint
        domain: bigint
        seed: bigint
        rounds: bigint
        output: bigint
    }[] = []
    for (let i = 0; i < 100; i++) {
        const domain = BigInt(1000 + Math.floor(Math.random() * 9001)) // random in [1000, 9000]
        const input = BigInt(Math.floor(Math.random() * Number(domain))) // random in [0, domain)
        const seed = BigInt(hexlify(randomBytes(32)))
        const rounds = BigInt(Math.ceil(Math.random() * 4) * 2) // random in [2,8]
        const output = encrypt(input, domain, seed, rounds, f)
        testVectors.push({
            input,
            domain,
            seed,
            rounds,
            output: output,
        })
    }

    const feTest = `#test
fn test_fpe_encrypt() {
${testVectors
    .map((t) => `   assert encrypt(${t.input}, ${t.domain}, ${t.seed}, ${t.rounds}) == ${t.output}`)
    .join('\n')}
}`

    fs.writeFile(path.resolve(__dirname, '../src/fpe_encrypt_test.fe'), feTest, {
        encoding: 'utf-8',
    })
})()
