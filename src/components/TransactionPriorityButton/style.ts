import { makeStyles } from '@material-ui/core'
import { colors } from '@static/theme'

const useStyles = makeStyles(() => ({
  button: {
    height: 51,
    fontSize: 14,
    letterSpacing: '-0.3px',
    textTransform: 'none',
    fontWeight: 400,
    background: colors.invariant.newDark,
    border: `1px solid ${colors.invariant.light}`,
    borderRadius: 16,
    padding: '32px 16px',
    margin: '4px 0px',
    color: colors.invariant.light,
    overflow: 'hidden',
    '&:hover': {
      color: colors.invariant.light
    }
  },
  selectedButton: {
    height: 51,
    fontSize: 14,
    letterSpacing: '-0.3px',
    textTransform: 'none',
    fontWeight: 400,
    background: colors.invariant.light,
    border: `1px solid ${colors.invariant.light}`,
    borderRadius: 16,
    padding: '32px 16px',
    margin: '4px 0px',
    color: colors.invariant.text,
    overflow: 'hidden',
    '&:hover': {
      color: colors.invariant.text
    }
  },
  marketFee: {
    fontFamily: 'Mukta',
    fontWeight: 400,
    fontSize: 12,
    lineHeight: '16px',
    letterSpacing: '-0.03px',
    backgroundColor: 'inherit',
    color: 'inherit'
  },
  wrapper: {
    width: 280,
    textAlign: 'left',
    flexDirection: 'column',
    padding: '16 0'
  },
  maxFee: {
    fontSize: 16,
    background: colors.invariant.newDark,
    fontWeight: 400,
    lineHeight: '20px',
    letterSpacing: '-0.03px',
    color: `${colors.invariant.pink} !important`,
    marginLeft: 12,
    backgroundColor: 'inherit'
  },
  label: {
    fontFamily: 'Mukta',
    backgroundColor: 'inherit',
    color: 'inherit',
    fontWeight: 700,
    fontSize: 16,
    lineHeight: '20px',
    letterSpacing: '-0.03px'
  }
}))

export default useStyles
