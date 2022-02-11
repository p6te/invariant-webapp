import { makeStyles, Theme } from '@material-ui/core'
import { colors } from '@static/theme'

const useStyles = makeStyles(() => ({
  container: {
    padding: '0 24px',
    borderRadius: '24px',
    backgroundColor: colors.invariant.component
  },
  pagination: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  }
}))

export default useStyles
