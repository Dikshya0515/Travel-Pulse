import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";

import { useCheckoutMutation } from "../../redux/apis/bookingApi";
import ButtonAuth from "../form/ButtonAuth";
import { convertDate } from "../../utils/date";
import { setAlert } from "../../redux/slices/userSlice";
import "./TourBooking.css";

export default function TourBooking({ set, tourId, startDates, maxGroupSize }) {
  const [date, setDate] = useState("");
  const [tickets, setTickets] = useState();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get("status");
  const [checkout, { isLoading, data, error }] = useCheckoutMutation();

  // Helper function to safely check if a date is valid
  const isValidDate = (dateValue) => {
    try {
      const date = new Date(dateValue);
      return !isNaN(date.getTime());
    } catch (error) {
      return false;
    }
  };

  // Helper function to safely convert date to ISO string
  const safeToISOString = (dateValue) => {
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } catch (error) {
      return null;
    }
  };

  // DEBUG: Log all the props when component mounts
  useEffect(() => {
    console.log("=== TourBooking Component Debug ===");
    console.log("tourId:", tourId);
    console.log("maxGroupSize:", maxGroupSize);
    console.log("startDates:", startDates);
    console.log("startDates type:", typeof startDates);
    console.log("startDates length:", startDates?.length);
    
    if (startDates && Array.isArray(startDates)) {
      console.log("=== Individual Date Analysis ===");
      startDates.forEach((dateItem, index) => {
        const dateValue = dateItem.dateValue;
        const isValid = isValidDate(dateValue);
        const isoString = safeToISOString(dateValue);
        
        console.log(`Date ${index}:`, {
          _id: dateItem._id,
          dateValue: dateValue,
          dateValueType: typeof dateValue,
          participants: dateItem.participants,
          isValidDate: isValid,
          rawDateObject: new Date(dateValue),
          dateString: isValid ? new Date(dateValue).toString() : "Invalid Date",
          isoString: isoString
        });
        
        if (!isValid) {
          console.warn(`⚠️ Invalid date found at index ${index}:`, dateValue);
        }
      });
    } else {
      console.log("startDates is not an array or is undefined/null");
    }
    console.log("=== End Debug ===");
  }, [startDates, tourId, maxGroupSize]);

  useEffect(() => {
    if (data?.session?.url) {
      window.location.href = data.session.url;
    }
  }, [data]);

  useEffect(() => {
    if (error) dispatch(setAlert({ type: "error", msg: error }));

    if (paymentStatus === "failed")
      dispatch(setAlert({ type: "error", msg: "Booking failed!" }));
  }, [error, dispatch, paymentStatus]);

  const dateHandler = (e) => {
    console.log("=== Date Selection Debug ===");
    console.log("Selected raw value:", e.target.value);
    console.log("Selected value type:", typeof e.target.value);
    console.log("Is empty string:", e.target.value === "");
    
    if (e.target.value !== "") {
      const selectedDate = new Date(e.target.value);
      console.log("New Date result:", selectedDate);
      console.log("Is valid date:", !isNaN(selectedDate.getTime()));
      console.log("Date toString:", selectedDate.toString());
    }
    console.log("=== End Date Selection Debug ===");
    
    setDate(e.target.value);
    setTickets(1);
  };

  const incrementHandler = () => {
    console.log("=== Increment Handler Debug ===");
    console.log("Current date state:", date);
    console.log("Current tickets:", tickets);
    
    if (!startDates || !Array.isArray(startDates)) {
      console.log("No valid startDates array");
      return;
    }

    const selectedDateObj = startDates.find((el) => {
      const elDateISO = safeToISOString(el.dateValue);
      const currentDateISO = safeToISOString(date);
      
      if (!elDateISO || !currentDateISO) {
        return false;
      }
      
      console.log("Comparing:", elDateISO, "with", currentDateISO);
      return elDateISO === currentDateISO;
    });
    
    console.log("Found date object:", selectedDateObj);
    
    if (selectedDateObj) {
      const maximumValue = maxGroupSize - selectedDateObj.participants;
      console.log("Maximum available tickets:", maximumValue);
      if (tickets < maximumValue) {
        setTickets((prevState) => prevState + 1);
      } else {
        console.log("Maximum tickets reached");
      }
    } else {
      console.log("No matching date object found");
    }
    console.log("=== End Increment Debug ===");
  };

  const decrementHandler = () => {
    console.log("=== Decrement Handler Debug ===");
    console.log("Current tickets:", tickets);
    if (tickets > 1) {
      setTickets((prevState) => prevState - 1);
    } else {
      console.log("Cannot go below 1 ticket");
    }
    console.log("=== End Decrement Debug ===");
  };

  const bookingHandler = (e) => {
    e.preventDefault();
    
    console.log("=== Booking Handler Debug ===");
    console.log("Form submission triggered");
    console.log("Current date:", date);
    console.log("Current tickets:", tickets);
    console.log("Date validation:", isValidDate(date));
    
    if (!date || !isValidDate(date)) {
      console.log("Invalid date, showing error");
      dispatch(setAlert({ type: "error", msg: "Please select a valid date!" }));
      return;
    }
    
    const formData = { date, tickets };
    console.log("Sending formData to backend:", formData);
    console.log("tourId:", tourId);
    console.log("=== End Booking Debug ===");
    
    checkout({ tourId, formData });
  };

  // Create a safe array of valid dates
  const validStartDates = () => {
    if (!startDates || !Array.isArray(startDates)) {
      console.log("No valid startDates array, returning empty array");
      return [];
    }
    
    return startDates.filter(el => {
      const isValid = isValidDate(el.dateValue);
      if (!isValid) {
        console.log("Filtering out invalid date:", el.dateValue);
      }
      return isValid;
    });
  };

  const validDates = validStartDates();

  return (
    <div className={`tour_booking ${set && "set-tour_booking"}`}>
      <div className={`tour_dates ${set && "set-tour_dates"}`}>
        <div className="dates_container">
          <h3>Available Dates</h3>
          {validDates.length > 0 ? (
            validDates.map((el) => {
              try {
                return (
                  <p key={el._id}>{convertDate(el.dateValue, true)}</p>
                );
              } catch (error) {
                console.error("Error converting date for display:", el.dateValue, error);
                return (
                  <p key={el._id}>Invalid Date</p>
                );
              }
            })
          ) : (
            <p>No valid dates available</p>
          )}
        </div>

        <div className="dates_container">
          <h3>Tickets Available</h3>
          {validDates.length > 0 ? (
            validDates.map((el) => (
              <p key={el._id}>{maxGroupSize - el.participants}</p>
            ))
          ) : (
            <p>-</p>
          )}
        </div>

        <div className="vertical-line">&nbsp;</div>

        <form onSubmit={bookingHandler} className="form_booking">
          <div className="date_input">
            <svg className="icon-green icon-small icon-down booking-down">
              <use xlinkHref="/img/icons.svg#icon-chevron-down"></use>
            </svg>
            <select name="date" onChange={dateHandler} value={date}>
              <option value="">
                {validDates.length > 0 ? "CHOOSE DATE:" : "NO DATES AVAILABLE"}
              </option>
              {validDates.map((el) => {
                const isoString = safeToISOString(el.dateValue);
                
                if (!isoString) {
                  console.error("Could not convert date to ISO string:", el.dateValue);
                  return null;
                }
                
                console.log("Rendering option:", {
                  _id: el._id,
                  originalValue: el.dateValue,
                  isoString: isoString,
                });
                
                try {
                  return (
                    <option key={el._id} value={isoString}>
                      {convertDate(el.dateValue, true)}
                    </option>
                  );
                } catch (error) {
                  console.error("Error rendering date option:", el.dateValue, error);
                  return null;
                }
              })}
            </select>
          </div>

          {date && (
            <div className="booking_tickets">
              <button type="button" onClick={decrementHandler}>
                -
              </button>
              <p>{tickets}</p>
              <button type="button" onClick={incrementHandler}>
                +
              </button>
            </div>
          )}
          <ButtonAuth isLoading={isLoading}>Book</ButtonAuth>
        </form>
      </div>
    </div>
  );
}