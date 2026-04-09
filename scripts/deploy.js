/**
 * Deploy RibbonPuddle contract.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network base-sepolia   # testnet
 *   npx hardhat run scripts/deploy.js --network base           # mainnet
 *
 * After deploying, set VITE_PUDDLE_CONTRACT_ADDRESS in .env to the address printed below.
 */

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying with:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Balance:', ethers.formatEther(balance), 'ETH')

  const Factory = await ethers.getContractFactory('RibbonPuddle')
  const contract = await Factory.deploy()
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log('\nRibbonPuddle deployed to:', address)
  console.log('\nAdd to .env:')
  console.log(`VITE_PUDDLE_CONTRACT_ADDRESS=${address}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
