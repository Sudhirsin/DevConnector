import { SET_ALERT, REMOVE_ALERT } from './types'
// import { v4 as uuid } from 'uuid';
import uuid from 'uuid/v4';

export const setAlert = (msg, alertType, timeout = 5000) => dispatch => {
    const id = uuid();

    dispatch({
        type: SET_ALERT,
        payload: { msg, alertType, id }
    });

    // remove the alert mes sage
    setTimeout(() => dispatch({ type: REMOVE_ALERT, payload: id }), timeout);
}