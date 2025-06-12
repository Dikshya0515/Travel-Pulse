const crypto = require("crypto");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const User = require("../models/userModel");
const Booking = require("../models/bookingModel");
const AppError = require("../utils/appError");
const Email = require("../utils/email");
const sendSMS = require("../utils/mobileSMS");
const { createTokensAndCookies } = require("../utils/tokensAndCookies");
const Tour = require("../models/tourModel");

//* Create and send tokens *****************************************

exports.sendTokensAndCookies = async (
  req,
  res,
  user,
  statusCode,
  redirectUrl
) => {
  if (req.cookies?.refresh) {
    // If any cookie => remove it from DB
    user.refreshTokens = user.refreshTokens.filter(
      (rt) => rt.token !== req.cookies.refresh
    );

    // Reuse detection
    const foundToken = await User.findOne({
      "refreshTokens.token": req.cookies.refresh,
    });
    if (!foundToken) user.refreshTokens = [];
  }

  const accessToken = await createTokensAndCookies(user, res);

  if (user.provider === "local") {
    res.status(statusCode).json({
      status: "SUCCESS",
      accessToken,
    });
  } else {
    res.redirect(`${process.env.FRONTEND_URL}${redirectUrl}?status=success`);
  }
};

//* Delete expired refresh tokens **********************************

exports.deleteExpiredTokens = async (user) => {
  user.refreshTokens = user.refreshTokens.filter(
    (rt) => rt.expiresIn.getTime() > Date.now()
  );
};

//* create and send verification code ******************************

exports.createAndSendVerificationCode = async (
  res,
  next,
  user,
  type,
  medium
) => {
  const resetCode = user.createVerificationCode(type);

  try {
    // send token to user's mail/phone
    if (medium === "email" && type === "link") {
      const resetURL = `${process.env.FRONTEND_URL}/auth/passwordReset/${resetCode}`;
      await new Email(user, resetURL).sendPasswordReset();
    } else if (medium === "email" && type === "code") {
      await new Email(user, resetCode).sendVerificationCode();
    } else if (medium === "phone" && type === "code") {
      await sendSMS(resetCode, user.phone);
    } else {
      throw new AppError(
        "Please choose a valid way - email(link/code) or phone(code) only!",
        400
      );
    }

    await user.save({ validateBeforeSave: false });
    res
      .status(200)
      .json({ status: "SUCCESS", message: `Code sent to your ${medium}!` });
  } catch (error) {
    console.error("Error:", error);

    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save({ validateBeforeSave: false });
    next(
      new AppError(
        `Error sending verification code to your ${medium}. Try again later!`,
        500
      )
    );
  }
};

//* Verify code ****************************************************

exports.verifyCode = async (code, next) => {
  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");
  const user = await User.findOne({
    verificationCode: hashedCode,
    verificationCodeExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError("Invalid Code or code has expired.", 400));
  }

  return user;
};

//* change password ************************************************

exports.changePassword = async (req, res, user) => {
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  user.verificationCodeChecked = undefined;
  await user.save();

  res.status(200).json({ status: "SUCCESS" });
};

//* filter req.body ************************************************

exports.filterObj = (obj, allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

//* create booking checkout ****************************************

exports.createBookingCheckout = async (session) => {
  try {
    console.log('Processing booking checkout for session:', session.id);
    console.log('Session type:', session.object);
    console.log('Session status:', session.status || session.payment_status);

    // Only process checkout.session.completed events
    if (session.object !== 'checkout.session') {
      console.log('Skipping non-checkout session object:', session.object);
      return;
    }

    // Check if booking already exists for this checkout session
    const existingBooking = await Booking.findOne({ 
      stripe_session_id: session.id 
    });
    
    if (existingBooking) {
      console.log('Booking already exists for checkout session:', session.id);
      return existingBooking;
    }

    // Retrieve line items from the session
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product']
    });
    
    if (!lineItems.data || lineItems.data.length === 0) {
      throw new Error('No line items found in checkout session');
    }

    const lineItem = lineItems.data[0];
    
    // Extract data from session
    const tourId = session.client_reference_id || session.metadata?.tourId;
    const userId = session.metadata?.userId;
    const tourStartDate = session.metadata?.tourStartDate;
    const tickets = parseInt(session.metadata?.tickets) || lineItem.quantity;
    
    if (!tourId || !userId || !tourStartDate) {
      throw new Error(`Missing required data: tourId=${tourId}, userId=${userId}, tourStartDate=${tourStartDate}`);
    }

    // Find the tour and user
    const tour = await Tour.findById(tourId);
    if (!tour) {
      throw new Error(`Tour not found with ID: ${tourId}`);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    const price = session.amount_total / 100;
    const receipt = session.receipt_url;
    const payment_intent = session.payment_intent;
    const status = session.payment_status === 'paid' ? 'paid' : 'pending';

    console.log('Creating booking with data:', {
      tour: tour._id,
      user: user._id,
      price,
      tickets,
      tourStartDate,
      status,
      stripe_session_id: session.id
    });

    // Create booking data
    const bookingData = {
      tour: tour._id,
      user: user._id,
      price,
      tickets,
      tourStartDate: new Date(tourStartDate),
      receipt,
      status,
      stripe_session_id: session.id, // Add this to prevent duplicates
    };

    // Only add payment_intent if it exists
    if (payment_intent) {
      bookingData.payment_intent = payment_intent;
    }

    // Create the booking
    const booking = await Booking.create(bookingData);

    // Update tour participants
    const dateObj = tour.startDates.find(
      (el) => el.dateValue.getTime() === new Date(tourStartDate).getTime()
    );
    
    if (dateObj) {
      dateObj.participants += tickets;
      await tour.save();
      console.log(`Updated tour participants: +${tickets} for date ${tourStartDate}`);
    } else {
      console.error('Date not found in tour.startDates for:', tourStartDate);
    }

    console.log('Booking created successfully:', booking._id);
    return booking;

  } catch (error) {
    console.error('Error in createBookingCheckout:', error);
    throw error;
  }
};