import { Button, Grid, Typography } from '@material-ui/core'
import React, { useState, useEffect } from 'react'
import PriceRangePlot from '@components/NewDesign/PriceRangePlot/PriceRangePlot'
import RangeInput from '@components/NewDesign/Inputs/RangeInput/RangeInput'
import useStyles from './style'
import { nearestPriceIndex } from '@consts/utils'

export interface IRangeSelector {
  data: Array<{ x: number; y: number }>
  midPriceIndex: number
  tokenFromSymbol: string
  tokenToSymbol: string
  onChangeRange: (leftIndex: number, rightIndex: number) => void
  blocked?: boolean
  blockerInfo?: string
}

export const RangeSelector: React.FC<IRangeSelector> = ({
  data,
  midPriceIndex,
  tokenFromSymbol,
  tokenToSymbol,
  onChangeRange,
  blocked = false,
  blockerInfo
}) => {
  const classes = useStyles()

  const [leftRange, setLeftRange] = useState(0)
  const [rightRange, setRightRange] = useState(0)

  const [leftInput, setLeftInput] = useState('')
  const [rightInput, setRightInput] = useState('')

  const [plotMin, setPlotMin] = useState(0)
  const [plotMax, setPlotMax] = useState(data[midPriceIndex].x * 2)

  const [waiting, setWaiting] = useState(false)

  const zoomMinus = () => {
    if (plotMin > data[0].x || plotMax < data[data.length - 1].x) {
      const diff = plotMax - plotMin
      setPlotMin(plotMin - (diff / 4))
      setPlotMax(plotMax + (diff / 4))
    }
  }

  const zoomPlus = () => {
    const diff = plotMax - plotMin
    if (data.length >= 2 && diff >= data[1].x - data[0].x) {
      setPlotMin(plotMin + (diff / 6))
      setPlotMax(plotMax - (diff / 6))
    }
  }

  const changeRangeHandler = (left: number, right: number) => {
    setLeftRange(left)
    setRightRange(right)

    setLeftInput(data[left].x.toString())
    setRightInput(data[right].x.toString())

    onChangeRange(left, right)
  }

  useEffect(() => {
    if (!waiting) {
      changeRangeHandler(
        Math.round(midPriceIndex / 2),
        Math.min(Math.round(3 * midPriceIndex / 2), data.length - 1)
      )
      setPlotMin(data[0].x)
      setPlotMax(data[0].x + ((data[midPriceIndex].x - data[0].x) * 2))
    }
  }, [waiting])

  useEffect(() => {
    if (blocked && !waiting) {
      setWaiting(true)
    } else if (!blocked && waiting) {
      setWaiting(false)
    }
  }, [blocked])

  return (
    <Grid container className={classes.wrapper}>
      <Typography className={classes.header}>Price range</Typography>
      <Grid container className={classes.innerWrapper}>
        <PriceRangePlot
          className={classes.plot}
          data={data}
          onChangeRange={changeRangeHandler}
          leftRangeIndex={leftRange}
          rightRangeIndex={rightRange}
          midPriceIndex={midPriceIndex}
          plotMin={plotMin}
          plotMax={plotMax}
          zoomMinus={zoomMinus}
          zoomPlus={zoomPlus}
        />
        <Typography className={classes.subheader}>Set price range</Typography>
        <Grid container direction='row' justifyContent='space-between' className={classes.inputs}>
          <RangeInput
            className={classes.input}
            label='Min price'
            tokenFromSymbol={tokenFromSymbol}
            tokenToSymbol={tokenToSymbol}
            currentValue={leftInput}
            setValue={setLeftInput}
            decreaseValue={() => {
              changeRangeHandler(Math.max(0, leftRange - 1), rightRange)
            }}
            increaseValue={() => {
              changeRangeHandler(Math.min(rightRange - 1, leftRange + 1), rightRange)
            }}
            onBlur={() => {
              changeRangeHandler(Math.min(rightRange - 1, nearestPriceIndex(+leftInput, data)), rightRange)
            }}
          />
          <RangeInput
            className={classes.input}
            label='Max price'
            tokenFromSymbol={tokenFromSymbol}
            tokenToSymbol={tokenToSymbol}
            currentValue={rightInput}
            setValue={setRightInput}
            decreaseValue={() => {
              changeRangeHandler(leftRange, Math.max(leftRange + 1, rightRange - 1))
            }}
            increaseValue={() => {
              changeRangeHandler(leftRange, Math.min(data.length - 1, rightRange + 1))
            }}
            onBlur={() => {
              changeRangeHandler(leftRange, Math.max(leftRange + 1, nearestPriceIndex(+rightInput, data)))
            }}
          />
        </Grid>
        <Grid container direction='row' justifyContent='space-between'>
          <Button
            className={classes.button}
            onClick={() => {
              changeRangeHandler(
                Math.round(midPriceIndex / 2),
                Math.min(Math.round(3 * midPriceIndex / 2), data.length - 1)
              )
              setPlotMin(data[0].x)
              setPlotMax(data[0].x + ((data[midPriceIndex].x - data[0].x) * 2))
            }}
          >
            Reset range
          </Button>
          <Button
            className={classes.button}
            onClick={() => {
              changeRangeHandler(
                0,
                data.length - 1
              )
            }}
          >
            Set full range
          </Button>
        </Grid>

        {
          blocked && (
            <>
              <Grid className={classes.blocker} />
              <Grid container className={classes.blockedInfoWrapper} justifyContent='center' alignItems='center'>
                <Typography className={classes.blockedInfo}>{blockerInfo}</Typography>
              </Grid>
            </>
          )
        }
      </Grid>
    </Grid>
  )
}

export default RangeSelector
