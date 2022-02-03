import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useMemo, useState } from 'react'
import * as R from 'remeda'
import { network, status } from '@selectors/solanaConnection'
import { Status } from '@reducers/solanaConnection'
import { actions } from '@reducers/pools'
import { getMarketProgramSync } from '@web3/programs/amm'
import { pools, poolTicks } from '@selectors/pools'
import { getNetworkTokensList, findPairs } from '@consts/utils'
import { swap } from '@selectors/swap'
import { Pair } from '@invariant-labs/sdk'

const MarketEvents = () => {
  const dispatch = useDispatch()
  const marketProgram = getMarketProgramSync()
  const { tokenFrom, tokenTo } = useSelector(swap)
  const networkStatus = useSelector(status)
  const networkType = useSelector(network)
  const poolsObj = useSelector(pools)

  const allPools = useMemo(() => Object.values(poolsObj), [poolsObj])

  const poolTicksArray = useSelector(poolTicks)
  const [subscribedTick, _setSubscribeTick] = useState<
    Array<{ fromToken: string; toToken: string; indexPool: number }>
  >([])
  useEffect(() => {
    if (networkStatus !== Status.Initialized || !marketProgram) {
      return
    }
    const connectEvents = () => {
      dispatch(actions.setTokens(getNetworkTokensList(networkType)))
    }

    connectEvents()
  }, [dispatch, networkStatus, marketProgram])

  useEffect(() => {
    if (networkStatus !== Status.Initialized || !marketProgram) {
      return
    }

    const connectEvents = () => {
      allPools.forEach((pool, index) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        marketProgram.onPoolChange(pool.tokenX, pool.tokenY, { fee: pool.fee.v }, poolStructure => {
          dispatch(
            actions.updatePool({
              index,
              poolStructure
            })
          )
        })
      })
    }

    connectEvents()
  }, [dispatch, allPools.length, networkStatus, marketProgram])

  useEffect(() => {
    if (
      networkStatus !== Status.Initialized ||
      !marketProgram ||
      allPools.length === 0
    ) {
      return
    }
    const connectEvents = async () => {
      if (tokenFrom && tokenTo) {
        allPools.forEach((pool, indexPool) => {
          if (
            subscribedTick.findIndex(
              e =>
                ((e.fromToken === tokenFrom.toString() && e.toToken === tokenTo.toString()) ||
                  (e.toToken === tokenFrom.toString() && e.fromToken === tokenTo.toString())) &&
                e.indexPool === indexPool
            ) !== -1
          ) {
            return
          }
          subscribedTick.push({
            fromToken: pool.tokenX.toString(),
            toToken: pool.tokenY.toString(),
            indexPool
          })
          R.forEachObj(poolTicksArray, tick => {
            tick.forEach(singleTick => {
              marketProgram
                .onTickChange(
                  new Pair(pool.tokenX, pool.tokenY, { fee: pool.fee.v }),
                  singleTick.index,
                  tickObject => {
                    dispatch(
                      actions.updateTicks({
                        poolIndex: indexPool.toString(),
                        index: singleTick.index,
                        tick: tickObject
                      })
                    )
                  }
                )
                .then(() => {})
                .catch(() => {})
            })
          })
        })
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    connectEvents()
  }, [networkStatus, marketProgram, allPools.length])

  useEffect(() => {
    if (tokenFrom && tokenTo) {
      const pools = findPairs(tokenFrom, tokenTo, allPools)

      pools.forEach(pool => {
        // trunk-ignore(eslint/@typescript-eslint/no-floating-promises)
        marketProgram.getAllTicks(new Pair(tokenFrom, tokenTo, { fee: pool.fee.v })).then(res => {
          dispatch(actions.setTicks({ index: pool.address.toString(), tickStructure: res }))
        })
      })
    }
  }, [tokenFrom, tokenTo])

  return null
}

export default MarketEvents
