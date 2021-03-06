import React from 'react';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import TextField from 'material-ui/TextField';
import Button from 'material-ui/Button';
import {FormControl} from 'material-ui/Form';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Table, {TableBody, TableCell, TableHead, TableRow, TableFooter} from 'material-ui/Table';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  withMobileDialog,
} from 'material-ui/Dialog';
import Hidden from 'material-ui/Hidden';
import IconButton from 'material-ui/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import DoneIcon from '@material-ui/icons/Done';
import WarningIcon from '@material-ui/icons/Warning';
import Tooltip from 'material-ui/Tooltip';
import {saveFriends, emailLookup, getFriends, destroyFriend} from '../../api'
import * as routes from "../../constants/routes";
import * as Validator from "../../utils/Validator";


class Friends extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      firstname: {value: '', touched: false, isValid: false, required: true},
      lastname: {value: '', touched: false, isValid: false, required: true},
      email: {value: '', touched: false, isValid: false, required: true, validationMethod: Validator.validEmail},
      cellphone: {value: '', touched: false, isValid: false, required: true, validationMethod: Validator.validCellphone},
      friends: [],
      dialogOpen: false
    };
    this.friendToDelete = {
      id: null,
      idx: -1
    }
  }

  componentDidMount = () => {
    if (this.props.currentUser == null) {
      this.props.history.push(routes.PERSONAL_DATA);
    } else {
      getFriends(this.props.currentUser).then(response => {
        this.setState({friends: response});
      });
    }
  };

  handleInput = (event) => {
    const {name, value} = event.target;
    const hash = this.state[name];
    hash.value = value;
    hash.isValid = this.isValid(name, value);
    this.setState({[name]: hash});
  };

  handleFocus = (event) => {
    const name = event.target.name;
    const hash = this.state[name];
    hash.touched = true;
    hash.isValid = this.isValid(name, event.target.value);
    this.setState({[name]: hash});
  };

  isValid = (name, value) => {
    const {required, validationMethod, validationParams} = this.state[name];
    let possibleParam = this.state[validationParams];
    if (possibleParam) {
      possibleParam = possibleParam.value;
    }
    return (!required || value !== "") && (!validationMethod || validationMethod.call(this, value, possibleParam));
  }

  addFriend = () => {
    const {friends, dialogOpen, ...fields} = this.state;
    if (Object.keys(fields).filter(f => !fields[f].isValid).length > 0) {
      alert('Algunos de los campos tienen información no válida');
      return;
    }
    emailLookup(fields.email.value).then(response => {
      if (response.new_user) {
        this.setState({
          friends: [...friends, {
            firstname: fields.firstname.value,
            lastname: fields.lastname.value,
            email: fields.email.value,
            cellphone: fields.cellphone.value,
            invited_by_id: this.props.currentUser.id,
            new_user: true
          }]
        });
      } else {
        alert('Ya existe un voluntario con ese correo.');
      }
      this.resetValues();
    })
  };

  // Remove a friend just form collection
  deleteFriend = (idFriend) => {
    let friends = this.state.friends;
    friends.splice(idFriend, 1);
    this.setState({friends: friends});
  };

  confirmRemoveFriend = (idFriend, idx) => {
    this.friendToDelete = { id: idFriend, idx: idx };
    this.setState({dialogOpen: true});
  };

  handleDialogClose = () => {
    this.friendToDelete = { };
    this.setState({dialogOpen: false});

  }

  // Remove a friend in API
  removeFriend = () => {
    destroyFriend({id: this.props.currentUser.id, friendId: this.friendToDelete.id})
      .then((response) => {
        if (response.success === true) {
          this.deleteFriend(this.friendToDelete.idx);
        } else {
          alert("No se pudo eliminar a tu amigo");
        }
        this.handleDialogClose();
      })
  };

  handleSubmit = () => {
    saveFriends({friends: this.state.friends.filter(f => f.new_user)})
      .then((response) => {
        if (response.success === true) {
          // This is a ugly way of do it but...
          // If current user already has a location
          // we will keep him into friends page
          if (this.props.currentUser.has_location) {
            alert("Datos guardados con éxito\nEn esta página puedes revisar el estado de confirmación de tus amigos")
            getFriends(this.props.currentUser).then(response => {
              this.setState({friends: response});
            });
            return;
          }
          this.props.onUpdateHistory({
            currentRoute: routes.FRIENDS,
            friendsCount: this.state.friends.length,
            ...response
          });
        } else {
          alert('Error al tratar de guardar los amigos');
        }
      })
  };

  resetValues = () => {
    this.setState({
      firstname: {value: '', touched: false, isValid: false, required: true},
      lastname: {value: '', touched: false, isValid: false, required: true},
      email: {value: '', touched: false, isValid: false, required: true, validationMethod: Validator.validEmail},
      cellphone: {value: '', touched: false, isValid: false, required: true, validationMethod: Validator.validCellphone}
    });
  };

  render() {
    const { fullScreen } = this.props;

    return (
      <div className="friends">
        <header className="App-header">
          <h1 className="App-title">Inscribe a tus amigos</h1>
        </header>
        <Typography>
          Invita a tus amigos a participar en la colecta.
        </Typography>
        <Typography>
          Recuerda que tienes que invitar al menos a {this.props.settings.friends} amigos para reservar un punto y luego entre todos completar un
          grupo de 10.
        </Typography>
        <Grid container spacing={16}>
          <Grid item xs={12} md={4}>
            <form>
              <FormControl className="form-control">
                <TextField
                  label="Nombre"
                  name="firstname"
                  onFocus={this.handleFocus}
                  onChange={this.handleInput}
                  value={this.state.firstname.value}
                  error={this.state.firstname.touched && !this.state.firstname.isValid}
                  required={this.state.firstname.required}
                />
              </FormControl><br/>
              <FormControl className="form-control">
                <TextField
                  label="Apellido"
                  name="lastname"
                  onFocus={this.handleFocus}
                  onChange={this.handleInput}
                  value={this.state.lastname.value}
                  error={this.state.lastname.touched && !this.state.lastname.isValid}
                  required={this.state.lastname.required}
                />
              </FormControl><br/>
              <FormControl className="form-control">
                <TextField
                  label="Correo"
                  name="email"
                  onFocus={this.handleFocus}
                  onChange={this.handleInput}
                  value={this.state.email.value}
                  error={this.state.email.touched && !this.state.email.isValid}
                  required={this.state.email.required}
                />
              </FormControl><br/>
              <FormControl className="form-control">
                <TextField
                  label="Celular"
                  name="cellphone"
                  onFocus={this.handleFocus}
                  onChange={this.handleInput}
                  value={this.state.cellphone.value}
                  error={this.state.cellphone.touched && !this.state.cellphone.isValid}
                  required={this.state.cellphone.required}
                />
              </FormControl><br/>
              {
                this.state.friends.length < 10 &&
                <Button variant="raised" className="homepage-button" onClick={this.addFriend}>
                  Agregar amigo
                </Button>
              }
            </form>
          </Grid>
          {this.state.friends.length > 0 &&
          <Grid item md={4} xs={12}>
            <Hidden smDown>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell/>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Apellido</TableCell>
                    <TableCell>Correo</TableCell>
                    <TableCell>Celular</TableCell>
                    <TableCell/>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {this.state.friends.map((friend, idx) => {
                    return (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{friend.firstname}</TableCell>
                        <TableCell>{friend.lastname}</TableCell>
                        <TableCell>{friend.email}</TableCell>
                        <TableCell>{friend.cellphone}</TableCell>
                        <TableCell>
                          {
                            friend.new_user &&
                            <Tooltip title="Borrar">
                              <IconButton aria-label="Delete" onClick={() => this.deleteFriend(idx)}>
                                <DeleteIcon/>
                              </IconButton>
                            </Tooltip>
                          }
                          {
                            !friend.new_user &&
                            <Tooltip title="Borrar">
                              <IconButton aria-label="Delete" onClick={() => this.confirmRemoveFriend(friend.id, idx)}>
                                <DeleteIcon/>
                              </IconButton>
                            </Tooltip>
                          }
                          {
                            !friend.new_user &&
                            friend.confirmed &&
                            <Tooltip title="Confirmado">
                              <DoneIcon/>
                            </Tooltip>
                          }
                          {
                            !friend.new_user &&
                            !friend.confirmed &&
                            <Tooltip title="Pendiente de confirmación">
                              <WarningIcon/>
                            </Tooltip>
                          }
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6}>
                      {
                        this.state.friends.length >= this.props.settings.friends &&
                        <Button variant="raised" onClick={this.handleSubmit}>
                          Guardar
                        </Button>
                      }
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </Hidden>
            <Hidden mdUp>
              {this.state.friends.map((friend, idx) => {
                return (
                  <Card key={idx}>
                    <CardContent>

                      <Typography gutterBottom variant="headline" component="h2">
                        {idx + 1}. {friend.firstname} {friend.lastname}
                      </Typography>
                      <Typography component="p">
                        {friend.email}
                      </Typography>
                      <Typography component="p">
                        {friend.cellphone}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      {
                        friend.new_user &&
                        <Tooltip title="Borrar">
                          <IconButton aria-label="Delete" onClick={() => this.deleteFriend(idx)}>
                            <DeleteIcon/>
                          </IconButton>
                        </Tooltip>
                      }
                      {
                        !friend.new_user && this.props.currentUser.is_leader &&
                          <Tooltip title="Borrar">
                            <IconButton aria-label="Delete" onClick={() => this.confirmRemoveFriend(friend.id, idx)}>
                              <DeleteIcon/>
                            </IconButton>
                          </Tooltip>
                      }
                      {
                        !friend.new_user &&
                        friend.confirmed &&
                        <Tooltip title="Confirmado">
                          <DoneIcon/>
                        </Tooltip>
                      }
                      {
                        !friend.new_user &&
                        !friend.confirmed &&
                        <Tooltip title="Pendiente de confirmación">
                          <WarningIcon/>
                        </Tooltip>
                      }
                    </CardActions>
                  </Card>
                )
              })}
              {
                this.state.friends.length >= this.props.settings.friends &&
                <Button variant="raised" onClick={this.handleSubmit}>
                  Guardar
                </Button>
              }
            </Hidden>
          </Grid>
          }
        </Grid>
        <Dialog
          fullScreen={fullScreen}
          open={this.state.dialogOpen}
          onClose={this.handleDialogClose}
          aria-labelledby="responsive-dialog-title"
        >
          <DialogTitle id="responsive-dialog-title">{"Eliminar Amigo"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Estás seguro que quieres eliminar a tu amigo?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleDialogClose} color="primary">
              No!!!
            </Button>
            <Button onClick={this.removeFriend} color="primary" autoFocus>
              Si
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  };
};

export default withMobileDialog()(Friends);