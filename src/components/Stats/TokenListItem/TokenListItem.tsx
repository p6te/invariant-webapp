import React from 'react'
import { printBN } from '@consts/utils'
import { Grid, Typography } from '@material-ui/core'
import { BN } from '@project-serum/anchor'
import { colors } from '@static/theme'

import { useStyles } from './style'

interface IProps {
  displayType: string
  itemNumber?: number
  icon?: string
  name?: string
  symbol?: string
  price?: BN
  decimals?: number
  priceChange?: string
  volume?: string
  TVL?: string
}

const TokenListItem: React.FC<IProps> = ({
  displayType,
  itemNumber,
  icon,
  name,
  symbol,
  price = new BN(0),
  decimals = 0,
  priceChange,
  volume,
  TVL
}) => {
  const classes = useStyles()
  const isNegative = Number(priceChange) > 0 ? false : true
  return (
    <Grid>
      {displayType === 'tokens' ? (
        <Grid container style={{ color: colors.white.main }} className={classes.container}>
          <Typography component='p'>{itemNumber}</Typography>
          <Grid>
            <Typography>{`${name} (${symbol})`}</Typography>
          </Grid>
          <Typography>${Number(printBN(price, decimals)).toFixed(2)}</Typography>
          <Typography style={{ color: isNegative ? colors.invariant.error : colors.green.main }}>
            {isNegative ? `${priceChange}%` : `+${priceChange}%`}
          </Typography>
          <Typography>{volume}</Typography>
          <Typography>{TVL}</Typography>
        </Grid>
      ) : (
        <Grid container style={{ color: '#A9B6BF' }} className={classes.container}>
          <Typography>
            N<sup>o</sup>
          </Typography>
          <Grid>
            <Typography>Name</Typography>
          </Grid>
          <Typography>Price</Typography>
          <Typography>Price Change</Typography>
          <Typography>Volume 24H</Typography>
          <Typography>TVL</Typography>
        </Grid>
      )}
    </Grid>
  )
}
export default TokenListItem
