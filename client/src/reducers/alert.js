import { SET_ALERT, REMOVE_ALERT } from '../actions/types'



const initialState = [
    // we cant our intial state here
    // {
    //     id: 1,
    //     msg: 'Please Log in',
    //     alertType: 'success'
    // }
]

export default function(state = initialState, action) {

    const { type, payload } = action
    
    switch(type) {
        case SET_ALERT:  
            return [...state, payload]
        
        case REMOVE_ALERT: 
            return state.filter(alert => alert.id != payload)

        default:
            return state;
    }
}