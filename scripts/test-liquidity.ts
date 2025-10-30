import { ethers } from "ethers"
import { BASE_CONFIG, DEX_ADDRESSES } from "../utils/constants"

const FACTORY_ABI = ["function getPair(address tokenA, address tokenB) public view returns (address pair)"]
const PAIR_ABI = [
  "function getReserves() public view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() public view returns (address)",
  "function token1() public view returns (address)",
]

async function testLiquidity() {
  const tokenAddress = "0xf37d0e4ea93aca7e0d3afa9df2a7774cf5bdd583"

  console.log("[v0] ═══════════════════════════════════════════════════════════")
  console.log("[v0] LIQUIDITY DETECTION DIAGNOSTIC TEST")
  console.log("[v0] ═══════════════════════════════════════════════════════════")
  console.log(`[v0] Token Address: ${tokenAddress}`)
  console.log(`[v0] WETH Address: ${BASE_CONFIG.WETH_ADDRESS}`)
  console.log(`[v0] RPC URL: ${BASE_CONFIG.ALCHEMY_RPC_URL || BASE_CONFIG.RPC_URL}`)

  try {
    const rpcUrl = BASE_CONFIG.ALCHEMY_RPC_URL || BASE_CONFIG.RPC_URL
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Test RPC connection
    console.log("\n[v0] [TEST 1] Testing RPC connection...")
    const blockNumber = await provider.getBlockNumber()
    console.log(`[v0] ✓ RPC connected. Current block: ${blockNumber}`)

    // Test Uniswap V2
    console.log("\n[v0] [TEST 2] Checking Uniswap V2...")
    const v2Factory = new ethers.Contract(DEX_ADDRESSES.UNISWAP_V2.FACTORY, FACTORY_ABI, provider)
    console.log(`[v0] Factory address: ${DEX_ADDRESSES.UNISWAP_V2.FACTORY}`)

    const v2PairAddress = await v2Factory.getPair(tokenAddress, BASE_CONFIG.WETH_ADDRESS)
    console.log(`[v0] Pair address: ${v2PairAddress}`)

    if (v2PairAddress !== ethers.ZeroAddress) {
      const v2Pair = new ethers.Contract(v2PairAddress, PAIR_ABI, provider)
      const [reserve0, reserve1] = await v2Pair.getReserves()
      const token0 = await v2Pair.token0()
      const token1 = await v2Pair.token1()

      console.log(`[v0] Token0: ${token0}`)
      console.log(`[v0] Token1: ${token1}`)
      console.log(`[v0] Reserve0: ${reserve0.toString()} (${ethers.formatEther(reserve0)} formatted)`)
      console.log(`[v0] Reserve1: ${reserve1.toString()} (${ethers.formatEther(reserve1)} formatted)`)

      if (reserve0 > 0n && reserve1 > 0n) {
        console.log(`[v0] ✓ UNISWAP V2 LIQUIDITY FOUND!`)
      } else {
        console.log(`[v0] ✗ No liquidity in Uniswap V2 pair (zero reserves)`)
      }
    } else {
      console.log(`[v0] ✗ No Uniswap V2 pair found`)
    }

    // Test Aerodrome
    console.log("\n[v0] [TEST 3] Checking Aerodrome...")
    const aeroFactory = new ethers.Contract(DEX_ADDRESSES.AERODROME.FACTORY, FACTORY_ABI, provider)
    console.log(`[v0] Factory address: ${DEX_ADDRESSES.AERODROME.FACTORY}`)

    const aeroPairAddress = await aeroFactory.getPair(tokenAddress, BASE_CONFIG.WETH_ADDRESS)
    console.log(`[v0] Pair address: ${aeroPairAddress}`)

    if (aeroPairAddress !== ethers.ZeroAddress) {
      const aeroPair = new ethers.Contract(aeroPairAddress, PAIR_ABI, provider)
      const [reserve0, reserve1] = await aeroPair.getReserves()
      const token0 = await aeroPair.token0()
      const token1 = await aeroPair.token1()

      console.log(`[v0] Token0: ${token0}`)
      console.log(`[v0] Token1: ${token1}`)
      console.log(`[v0] Reserve0: ${reserve0.toString()} (${ethers.formatEther(reserve0)} formatted)`)
      console.log(`[v0] Reserve1: ${reserve1.toString()} (${ethers.formatEther(reserve1)} formatted)`)

      if (reserve0 > 0n && reserve1 > 0n) {
        console.log(`[v0] ✓ AERODROME LIQUIDITY FOUND!`)
      } else {
        console.log(`[v0] ✗ No liquidity in Aerodrome pair (zero reserves)`)
      }
    } else {
      console.log(`[v0] ✗ No Aerodrome pair found`)
    }

    console.log("\n[v0] ═══════════════════════════════════════════════════════════")
    console.log("[v0] DIAGNOSTIC TEST COMPLETE")
    console.log("[v0] ═══════════════════════════════════════════════════════════")
  } catch (error) {
    console.error("[v0] ERROR:", error)
  }
}

testLiquidity()
