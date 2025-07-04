import { Fragment, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import Search from '../ui/Search';
import { useLogoutMutation } from '../../redux/apis/authApi';
import { setAlert } from '../../redux/slices/userSlice';
import './Header.css';

import { getUserImageUrl } from '../../utils/imageUtils';

export default function Header() {
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logout, { error, data }] = useLogoutMutation();

  useEffect(() => {
    if (error) dispatch(setAlert({ type: 'error', msg: error }));

    if (data?.status === 'SUCCESS') {
      dispatch(setAlert({ type: 'success', msg: 'Logout successful.' }));
      navigate('/');
    }
  }, [navigate, data, error, dispatch]);

  return (
    <header className="header">
      <nav className="nav nav--tours">
        <Link to="/" className="nav__el">
          All tours
        </Link>
        <Search />
      </nav>
      <Link to="/" className="header__logo">
        <img src="/img/logo-white.png" alt="TravelPulse logo" />
      </Link>
      <nav className="nav nav--user">
        {user ? (
          <Fragment>
            <button type="button" className="nav__el" onClick={() => logout()}>
              Log out
            </button>
            <Link to="/me/profile" className="nav__el">
              <img
                // src={`/img/users/${user.photo}`}
                src={getUserImageUrl(user.photo)}
                alt={user.name}
                className="nav__user-img"
              />
              <span>Hi, {user.name.split(' ')[0]}!</span>
            </Link>
          </Fragment>
        ) : (
          <Fragment>
            <Link to="/auth/login" className="nav__el">
              Log in
            </Link>
            <Link to="/auth/signup" className="nav__el nav__el--cta">
              Sign up
            </Link>
          </Fragment>
        )}
      </nav>
    </header>
  );
}
