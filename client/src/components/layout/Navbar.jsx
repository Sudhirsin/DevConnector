import React, { Fragment } from "react";
import { Link } from 'react-router-dom'
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { logout, loadUser } from '../../actions/auth'


const Navbar = ({ auth: { isAuthenticated, loading }, logout }) => {
  
  const authLinks = (
    <ul>
       <li>
        <Link to="/dashboard">
          <i className="fas fa-user"></i>{' '}
          <span className="hide-sm">Dashboard</span>  
        </Link>
      </li>
      <li></li>
      <li>
        <a onClick={ logout } href='#!'>
          <i className="fas fa-sign-out-alt"></i>{' '}
          <span className="hide-sm">Logout</span>  
        </a>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul>
      <li>
        <a href='#!'>Developers</a>
      </li>
      <li>
        <Link to="/register">Register</Link>
      </li>
      <li>
        <Link to="/login">Login</Link>
      </li>
    </ul>
  );
  
  return (
    <nav className='navbar bg-dark'>
      <h1>
        <Link to="/">
          <i className='fas fa-code'></i> DevConnector
        </Link>
      </h1>

      {/* { !loading ? '': null} */} 
      {/* or we can write { !loading && "" } */}
      { !loading && (<Fragment>{ isAuthenticated ? authLinks : guestLinks }</Fragment>)}
    </nav>
  );
};

Navbar.propTypes = {
  logout: PropTypes.func.isRequired,
  aith: PropTypes.object.isRequired
}

const mapStateToProps = (state) => ({
  auth: state.auth
})

export default connect(mapStateToProps, { logout })(Navbar);