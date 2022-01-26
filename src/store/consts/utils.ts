import {
  calculatePriceSqrt,
  MAX_TICK,
  MIN_TICK,
  Pair,
  TICK_LIMIT
} from '@invariant-labs/sdk'
import { Decimal, PoolStructure, Tick } from '@invariant-labs/sdk/src/market'
import {
  parseLiquidityOnTicks,
  SimulateSwapInterface,
  simulateSwap
} from '@invariant-labs/sdk/src/utils'
import { BN } from '@project-serum/anchor'
import { PlotTickData } from '@reducers/positions'
import { u64 } from '@solana/spl-token'
import {
  ANA_DEV,
  MSOL_DEV,
  NetworkType,
  PAIRS,
  PRICE_DECIMAL,
  SOL_DEV,
  Token,
  USDC_DEV,
  USDT_DEV,
  WSOL_DEV
} from './static'
import mainnetList from './tokenLists/mainnet.json'
import { PublicKey } from '@solana/web3.js'
import { getMarketProgramSync } from '@web3/programs/amm'

export const tou64 = (amount: BN | String) => {
  // eslint-disable-next-line new-cap
  return new u64(amount.toString())
}
export const transformBN = (amount: BN): string => {
  // eslint-disable-next-line new-cap
  return (amount.div(new BN(1e2)).toNumber() / 1e4).toString()
}
export const printBN = (amount: BN, decimals: number): string => {
  const balanceString = amount.toString()
  if (balanceString.length <= decimals) {
    return '0.' + '0'.repeat(decimals - balanceString.length) + balanceString
  } else {
    return trimZeros(
      balanceString.substring(0, balanceString.length - decimals) +
        '.' +
        balanceString.substring(balanceString.length - decimals)
    )
  }
}
// Bad solution but i hate regex
export const trimZeros = (amount: string) => {
  try {
    return parseFloat(amount).toString()
  } catch (error) {
    return amount
  }
}
export const printBNtoBN = (amount: string, decimals: number): BN => {
  const balanceString = amount.split('.')
  if (balanceString.length !== 2) {
    return new BN(balanceString[0] + '0'.repeat(decimals))
  }
  // console.log(balanceString[1].length)
  if (balanceString[1].length <= decimals) {
    return new BN(
      balanceString[0] + balanceString[1] + '0'.repeat(decimals - balanceString[1].length)
    )
  }
  return new BN(0)
}
export interface ParsedBN {
  BN: BN
  decimal: number
}
export const stringToMinDecimalBN = (value: string): ParsedBN => {
  if (value.includes('.')) {
    const [before, after] = value.split('.')
    return {
      BN: new BN(`${before}${after}`),
      decimal: after.length || 0
    }
  }
  return {
    BN: new BN(value),
    decimal: 0
  }
}
export const capitalizeString = (str: string) => {
  if (!str) {
    return str
  }
  return str[0].toUpperCase() + str.substr(1).toLowerCase()
}

export const divUp = (a: BN, b: BN): BN => {
  return a.add(b.subn(1)).div(b)
}
export const divUpNumber = (a: number, b: number): number => {
  return Math.ceil(a / b)
}
export const removeTickerPrefix = (ticker: string, prefix: string[] = ['x', '$']): string => {
  const index = prefix.findIndex(p => ticker.startsWith(p))
  if (index && prefix[index]) {
    return ticker.substring(prefix[index].length)
  }
  return ticker
}

export interface PrefixConfig {
  B?: number
  M?: number
  K?: number
}

const defaultPrefixConfig: PrefixConfig = {
  B: 1000000000,
  M: 1000000,
  K: 10000
}

export const showPrefix = (nr: number, config: PrefixConfig = defaultPrefixConfig): string => {
  if (typeof config.B !== 'undefined' && nr >= config.B) {
    return 'B'
  }

  if (typeof config.M !== 'undefined' && nr >= config.M) {
    return 'M'
  }

  if (typeof config.K !== 'undefined' && nr >= config.K) {
    return 'K'
  }

  return ''
}

export interface FormatNumberThreshold {
  value: number
  decimals: number
  divider?: number
}

const defaultThresholds: FormatNumberThreshold[] = [
  {
    value: 10,
    decimals: 4
  },
  {
    value: 1000,
    decimals: 2
  },
  {
    value: 10000,
    decimals: 1
  },
  {
    value: 1000000,
    decimals: 2,
    divider: 1000
  },
  {
    value: 1000000000,
    decimals: 2,
    divider: 1000000
  },
  {
    value: Infinity,
    decimals: 2,
    divider: 1000000000
  }
]

export const formatNumbers =
  (thresholds: FormatNumberThreshold[] = defaultThresholds) =>
  (value: string) => {
    const num = Number(value)
    const threshold = thresholds.sort((a, b) => a.value - b.value).find(thr => num < thr.value)

    return threshold ? (num / (threshold.divider ?? 1)).toFixed(threshold.decimals) : value
  }

export const nearestPriceIndex = (price: number, data: Array<{ x: number; y: number }>) => {
  let nearest = 0

  for (let i = 1; i < data.length; i++) {
    if (Math.abs(data[i].x - price) < Math.abs(data[nearest].x - price)) {
      nearest = i
    }
  }

  return nearest
}

export const getScaleFromString = (value: string): number => {
  const parts = value.split('.')

  if ((parts?.length ?? 0) < 2) {
    return 0
  }

  return parts[1]?.length ?? 0
}

export const logBase = (x: number, b: number): number => Math.log(x) / Math.log(b)

export const calcYPerXPrice = (sqrtPrice: BN, xDecimal: number, yDecimal: number): number => {
  const sqrt = +printBN(sqrtPrice, PRICE_DECIMAL)
  const proportion = sqrt * sqrt

  return proportion / 10 ** (yDecimal - xDecimal)
}

export const spacingMultiplicityLte = (arg: number, spacing: number): number => {
  if (Math.abs(arg % spacing) === 0) {
    return arg
  }

  return arg >= 0 ? arg - (arg % spacing) : arg + (arg % spacing)
}

export const spacingMultiplicityGte = (arg: number, spacing: number): number => {
  if (Math.abs(arg % spacing) === 0) {
    return arg
  }

  return arg >= 0 ? arg + (arg % spacing) : arg - (arg % spacing)
}

export const createLiquidityPlot = (
  rawTicks: Tick[],
  pool: PoolStructure,
  isXtoY: boolean,
  tokenXDecimal: number,
  tokenYDecimal: number
) => {
  const sortedTicks = rawTicks.sort((a, b) => a.index - b.index)
  const parsedTicks = rawTicks.length ? parseLiquidityOnTicks(sortedTicks, pool) : []

  const ticks = rawTicks.map((raw, index) => ({
    ...raw,
    liqudity: parsedTicks[index].liquidity
  }))

  const ticksData: PlotTickData[] = []

  const min = minSpacingMultiplicity(pool.tickSpacing)
  const max = maxSpacingMultiplicity(pool.tickSpacing)

  if (!ticks.length || ticks[0].index !== min) {
    const minPrice = calcPrice(min, isXtoY, tokenXDecimal, tokenYDecimal)

    ticksData.push({
      x: minPrice,
      y: 0,
      index: min
    })
  }

  ticks.forEach((tick, i) => {
    if (i === 0 && tick.index - pool.tickSpacing > min) {
      const price = calcPrice(tick.index - pool.tickSpacing, isXtoY, tokenXDecimal, tokenYDecimal)
      ticksData.push({
        x: price,
        y: 0,
        index: tick.index - pool.tickSpacing
      })
    } else if (i > 0 && tick.index - pool.tickSpacing > ticks[i - 1].index) {
      const price = calcPrice(tick.index - pool.tickSpacing, isXtoY, tokenXDecimal, tokenYDecimal)
      ticksData.push({
        x: price,
        y: +printBN(ticks[i - 1].liqudity, PRICE_DECIMAL),
        index: tick.index - pool.tickSpacing
      })
    }

    const price = calcPrice(tick.index, isXtoY, tokenXDecimal, tokenYDecimal)
    ticksData.push({
      x: price,
      y: +printBN(ticks[i].liqudity, PRICE_DECIMAL),
      index: tick.index
    })
  })

  if (!ticks.length) {
    const maxPrice = calcPrice(max, isXtoY, tokenXDecimal, tokenYDecimal)

    ticksData.push({
      x: maxPrice,
      y: 0,
      index: max
    })
  } else if (ticks[ticks.length - 1].index !== max) {
    if (max - ticks[ticks.length - 1].index > pool.tickSpacing) {
      const price = calcPrice(
        ticks[ticks.length - 1].index + pool.tickSpacing,
        isXtoY,
        tokenXDecimal,
        tokenYDecimal
      )
      ticksData.push({
        x: price,
        y: 0,
        index: ticks[ticks.length - 1].index + pool.tickSpacing
      })
    }

    const maxPrice = calcPrice(max, isXtoY, tokenXDecimal, tokenYDecimal)

    ticksData.push({
      x: maxPrice,
      y: 0,
      index: max
    })
  }

  return isXtoY ? ticksData : ticksData.reverse()
}

export const createPlaceholderLiquidityPlot = (
  isXtoY: boolean,
  yValueToFill: number,
  tickSpacing: number,
  tokenXDecimal: number,
  tokenYDecimal: number
) => {
  const ticksData: PlotTickData[] = []

  const min = minSpacingMultiplicity(tickSpacing)
  const max = maxSpacingMultiplicity(tickSpacing)

  const minPrice = calcPrice(min, isXtoY, tokenXDecimal, tokenYDecimal)

  ticksData.push({
    x: minPrice,
    y: yValueToFill,
    index: min
  })

  const maxPrice = calcPrice(max, isXtoY, tokenXDecimal, tokenYDecimal)

  ticksData.push({
    x: maxPrice,
    y: yValueToFill,
    index: max
  })

  return isXtoY ? ticksData : ticksData.reverse()
}

export const getNetworkTokensList = (networkType: NetworkType): Record<string, Token> => {
  switch (networkType) {
    case NetworkType.MAINNET:
      return mainnetList.reduce(
        (all, token) => ({
          ...all,
          [token.address]: {
            ...token,
            address: new PublicKey(token.address)
          }
        }),
        {}
      )
    case NetworkType.DEVNET:
      return {
        [USDC_DEV.address.toString()]: USDC_DEV,
        [USDT_DEV.address.toString()]: USDT_DEV,
        [SOL_DEV.address.toString()]: SOL_DEV,
        [ANA_DEV.address.toString()]: ANA_DEV,
        [MSOL_DEV.address.toString()]: MSOL_DEV,
        [WSOL_DEV.address.toString()]: WSOL_DEV
      }
    default:
      return {}
  }
}

export const getPrimaryUnitsPrice = (
  price: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
) => {
  const xToYPrice = isXtoY ? price : 1 / price

  return xToYPrice * 10 ** (yDecimal - xDecimal)
}

export const nearestSpacingMultiplicity = (arg: number, spacing: number) => {
  const greater = spacingMultiplicityGte(arg, spacing)
  const lower = spacingMultiplicityLte(arg, spacing)

  const nearest = Math.abs(greater - arg) < Math.abs(lower - arg) ? greater : lower

  return Math.max(
    Math.min(nearest, maxSpacingMultiplicity(spacing)),
    minSpacingMultiplicity(spacing)
  )
}

export const nearestTickIndex = (
  price: number,
  spacing: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
) => {
  const base = Math.max(price, calcPrice(isXtoY ? MIN_TICK : MAX_TICK, isXtoY, xDecimal, yDecimal))
  const primaryUnitsPrice = getPrimaryUnitsPrice(base, isXtoY, xDecimal, yDecimal)
  const log = Math.round(logBase(primaryUnitsPrice, 1.0001))
  return nearestSpacingMultiplicity(log, spacing)
}

export const calcTicksAmountInRange = (
  min: number,
  max: number,
  tickSpacing: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
): number => {
  const primaryUnitsMin = getPrimaryUnitsPrice(min, isXtoY, xDecimal, yDecimal)
  const primaryUnitsMax = getPrimaryUnitsPrice(max, isXtoY, xDecimal, yDecimal)
  const minIndex = logBase(primaryUnitsMin, 1.0001)
  const maxIndex = logBase(primaryUnitsMax, 1.0001)

  return Math.ceil(Math.abs(maxIndex - minIndex) / tickSpacing)
}

export const calcPrice = (index: number, isXtoY: boolean, xDecimal: number, yDecimal: number) => {
  const price = calcYPerXPrice(calculatePriceSqrt(index).v, xDecimal, yDecimal)

  return isXtoY ? price : price !== 0 ? 1 / price : Number.MAX_SAFE_INTEGER
}

export const handleSimulate = async (
  pools: PoolStructure[],
  poolTicks: { [key in string]: Tick[] },
  networkType: NetworkType,
  slippage: Decimal,
  fromToken: PublicKey,
  toToken: PublicKey,
  amount: BN,
  currentPrice: BN
): Promise<{
  amountOut: BN
  simulateSuccess: boolean
  poolIndex: number
}> => {
  try {
    const marketProgram = getMarketProgramSync()

    let simulateSuccess: boolean = false
    let poolIndex: number = 0
    let i: number = 0
    const poolIndexes: number[] = []
    const swapPool = PAIRS[networkType].filter(
      pool =>
        (fromToken.equals(pool.tokenX) && toToken.equals(pool.tokenY)) ||
        (fromToken.equals(pool.tokenY) && toToken.equals(pool.tokenX))
    )
    // trunk-ignore(eslint/array-callback-return)
    PAIRS[networkType].map((pair, index) => {
      if (
        (fromToken.equals(pair.tokenX) && toToken.equals(pair.tokenY)) ||
        (fromToken.equals(pair.tokenY) && toToken.equals(pair.tokenX))
      ) {
        poolIndexes.push(index)
      }
    })
    if (!swapPool) {
      return { amountOut: new BN(0), simulateSuccess: false, poolIndex: 0 }
    }

    let swapSimulateRouterAmount: BN = new BN(0)
    for (const pool of swapPool) {
      const isXtoY = fromToken.equals(pool.tokenX) && toToken.equals(pool.tokenY)
      const tickMap = await marketProgram.getTickmap(
        new Pair(pool.tokenX, pool.tokenY, pool.feeTier)
      )

      const ticks: Map<number, Tick> = new Map<number, Tick>()
      if (ticks.size === 0) {
        for (const tick of poolTicks[i]) {
          ticks.set(tick.index, tick)
        }
      }
      if (amount.gt(new BN(0))) {
        const simulateObject: SimulateSwapInterface = {
          pair: new Pair(pool.tokenX, pool.tokenY, pool.feeTier),
          xToY: isXtoY,
          byAmountIn: true,
          swapAmount: amount,
          currentPrice: { v: currentPrice },
          slippage: slippage,
          pool: pools[poolIndexes[i]],
          ticks: ticks,
          tickmap: tickMap,
          market: marketProgram
        }
        try {
          const swapSimulateResault = simulateSwap(simulateObject)
          if (swapSimulateRouterAmount.lt(swapSimulateResault.accumulatedAmountOut)) {
            swapSimulateRouterAmount = swapSimulateResault.accumulatedAmountOut
            poolIndex = poolIndexes[i]
          }
        } catch (error) {
          i++
          continue
        }
        simulateSuccess = true
      } else {
        swapSimulateRouterAmount = new BN(0)
      }
      i++
    }
    return {
      amountOut: swapSimulateRouterAmount,
      simulateSuccess: simulateSuccess,
      poolIndex: poolIndex
    }
  } catch (error) {
    console.log(error)
    return { amountOut: new BN(0), simulateSuccess: false, poolIndex: 0 }
  }
}

export const minSpacingMultiplicity = (spacing: number) => {
  return Math.max(spacingMultiplicityGte(MIN_TICK, spacing), -(TICK_LIMIT - 2) * spacing)
}

export const maxSpacingMultiplicity = (spacing: number) => {
  return Math.min(spacingMultiplicityLte(MAX_TICK, spacing), (TICK_LIMIT - 2) * spacing)
}
