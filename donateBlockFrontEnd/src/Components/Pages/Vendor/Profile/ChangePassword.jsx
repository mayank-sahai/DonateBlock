import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import LockIcon from '@material-ui/icons/LockOpenTwoTone';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import withStyles from '@material-ui/core/styles/withStyles';
import BackendServices from "../../../../Services/BackendServices";
import Simplert from 'react-simplert';
import { withRouter } from 'react-router'


const styles = theme => ({
  icon: {
    marginRight: theme.spacing.unit * 2,
  },
  bigAvatar: {
    width: 80,
    height: 80,
  },
  layout: {
    width: 'auto',
    marginLeft: theme.spacing.unit * 3,
    marginRight: theme.spacing.unit * 3,
    [theme.breakpoints.up(400 + theme.spacing.unit * 3 * 2)]: {
      width: 400,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    marginTop: theme.spacing.unit * 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 3}px ${theme.spacing.unit * 3}px`,
  },
  avatar: {
    margin: theme.spacing.unit,
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE11 issue.
    marginTop: theme.spacing.unit,
  },
  submit: {
    marginTop: theme.spacing.unit * 3,
  },
});

class ChangePassword extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      alertType: '', 
      alertTitle: '',
      showAlert: false,
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.creatAlert = this.creatAlert.bind(this);
    this.getToken = this.getToken.bind(this);
    this.closeSimplert = this.closeSimplert.bind(this);
  }
  creatAlert(Alert, Type, Title) {
    this.setState(state => ({
      showAlert: Alert, 
      alertType: Type, 
      alertTitle: Title 
    }))
  };

  handleChange(event) {
    var obj = {};
    obj[event.target.id] = event.target.value;
    this.setState(obj);
  };

  getToken(){
    return JSON.parse(sessionStorage.getItem('user'));
  }

  handleSubmit(event) {
    this.state.newPassword === this.state.confirmPassword ? (
    BackendServices.changePassword(this.getToken().token, this.state.oldPassword, this.state.newPassword)
    .then(res => {
      this.creatAlert(true, "success", "Your Password has been changed successfully.");
  }, error => {

      console.log(error)
      if (error.responseJSON.error.error) 
          this.creatAlert(true, "error", JSON.stringify(error.responseJSON.error.error));
      else {
          this.creatAlert(true, "error", "Somethig went wrong.");
      }
    })
  ) : (
    this.creatAlert(true, "error", "New Password and Confirm Password do not match.")
  );
    event.preventDefault();
  };

  closeSimplert() {
    this.setState({showAlert: false});
    this .state.alertType === "success" && this.props.history.push('/profile');
};

render() {
  const { classes } = this.props;

  return (
    <React.Fragment>
      <CssBaseline />
      <Simplert
          showSimplert={this.state.showAlert}
          type={this.state.alertType}
          title={this.state.alertTitle}
          disableOverlayClick={true}
          onClose={this.closeSimplert}/>
      <main className={classes.layout}>
        <Paper className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Change Password
          </Typography>
          <form className={classes.form}>
            <FormControl margin="normal" required fullWidth>
              <InputLabel htmlFor="password">Old Password</InputLabel>
              <Input
                name="oldpassword"
                type="password"
                value={this.state.oldPassword}
                onChange={this.handleChange}
                id="oldPassword"
                autoComplete="old-password"
              />
            </FormControl>
            <FormControl margin="normal" required fullWidth>
              <InputLabel htmlFor="password">New Password</InputLabel>
              <Input
                name="password"
                type="password"
                value={this.state.newPassword}
                onChange={this.handleChange}
                id="newPassword"
                autoComplete="new-password"
              />
            </FormControl>
            <FormControl margin="normal" required fullWidth>
              <InputLabel htmlFor="password">Confirm Password</InputLabel>
              <Input
                name="confirmpassword"
                type="password"
                value={this.state.confirmPassword}
                onChange={this.handleChange}
                id="confirmPassword"
                autoComplete="confirm-password"
              />
            </FormControl>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                onClick={this.handleSubmit}
                className={classes.submit}
              >
                OK
              </Button>
          </form>
        </Paper>
      </main>
    </React.Fragment>
  );
}
}

ChangePassword.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withRouter(withStyles(styles)(ChangePassword));