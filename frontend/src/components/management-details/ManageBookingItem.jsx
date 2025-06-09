import { Fragment, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { convertDate } from '../../utils/date';
import Modal from '../ui/Modal';
import { useCancelBookingByIdMutation } from '../../redux/apis/bookingApi';
import { setAlert } from '../../redux/slices/userSlice';
import './ManageBookingItem.css';

export default function ManageBookingItem({ booking }) {
  const [modal, setModal] = useState(false);
  const dispatch = useDispatch();
  const [cancelBooking, { isLoading, error, data }] = useCancelBookingByIdMutation();
  
  // Add null checks and fallbacks
  const user = booking?.user || {};
  const tour = booking?.tour || {};
  const canCancel = booking?.status === 'pending' || booking?.status === 'paid';

  useEffect(() => {
    if (error) dispatch(setAlert({ type: 'error', msg: error }));

    if (data?.status === 'SUCCESS') {
      dispatch(setAlert({ type: 'success', msg: 'Booking was canceled.' }));
      setModal(false);
    }
  }, [data, error, dispatch]);

  // If booking is null/undefined, don't render anything
  if (!booking) {
    return null;
  }

  return (
    <Fragment>
      {modal && (
        <Modal
          heading="Cancel Booking"
          message={
            <>
              Do you want to cancel this booking and refund <span>${booking.price || 0}</span>?
            </>
          }
          onProceed={() => cancelBooking({ userId: user._id, bookingId: booking._id })}
          onCancel={() => setModal(false)}
          isLoading={isLoading}
          headerClass="heading-warning"
        />
      )}

      <div className="bookings-table-grid">
        <div className="table-img-item">
          <img 
            className="manage-user-img" 
            src={user.photo ? `/img/users/${user.photo}` : '/img/users/default.jpg'} 
            alt={user.name || 'User'} 
          />
          <div>
            <h3>{user.name || 'Unknown User'}</h3>
            <p>Booked on {booking.createdAt ? convertDate(booking.createdAt, true) : 'Unknown Date'}</p>
          </div>
        </div>

        <div className="table-img-item">
          {tour.imageCover ? (
            <img
              className="manage-tour-img"
              src={`/img/tours/${tour.imageCover}`}
              alt={tour.name || 'Tour'}
            />
          ) : (
            <div className="manage-tour-img placeholder-img">
              <span>No Image</span>
            </div>
          )}
          <div>
            <h3>{tour.name || 'Unknown Tour'}</h3>
            <p>{booking.tourStartDate ? convertDate(booking.tourStartDate, true) : 'Unknown Date'}</p>
          </div>
        </div>

        <div className="manage-booking-price">
          <p>${booking.price || 0}</p>
          <p className={`manage-booking-status booking_${booking.status || 'unknown'}`}>
            {booking.status || 'unknown'}
          </p>
        </div>

        {canCancel && user._id && booking._id && (
          <div className="actions">
            <button
              type="button"
              className="btn-secondary btn--xs secondary--red"
              onClick={() => setModal(true)}
            >
              <svg className="icon-delete icon-small">
                <use xlinkHref="/img/icons.svg#icon-x-square"></use>
              </svg>
              <p className="action-type">Cancel</p>
            </button>
          </div>
        )}
      </div>
    </Fragment>
  );
}