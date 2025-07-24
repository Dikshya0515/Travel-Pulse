const { authenticator } = require("otplib");
const QRCode = require("qrcode");

const User = require("../../models/userModel");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const {
  sendTokensAndCookies,
  verifyCode,
  createAndSendVerificationCode,
} = require("../helperFunctions");

//* Enable 2FA  ****************************************************

exports.enable2FA = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("No user found", 404));
  }

  const secret = authenticator.generateSecret();
  
  user.twoFactorSecret = secret;
  await user.save({ validateBeforeSave: false });
  

  // Use user's email instead of req.params.id
  const serviceLabel = "TravelPulse";
  const accountName = user.email; // Use the user's email
  
  const otpauthURL = authenticator.keyuri(accountName, serviceLabel, secret);
  const imageURL = await QRCode.toDataURL(otpauthURL);

  console.log("🔐 2FA Setup:", {
    userEmail: user.email,
    otpauthURL,
    secretLength: secret.length
  });

  res.status(200).json({ 
    status: "SUCCESS", 
    secret, 
    imageURL,
    // Include the manual entry key for debugging
    manualEntryKey: secret
  });
});

//* Verify 2FA  ****************************************************

exports.verify2FA = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found!", 404));
  }

  console.log("🔐 Verifying 2FA token:", {
    userEmail: user.email,
    tokenReceived: req.body.token,
    secretExists: !!user.twoFactorSecret,
    currentTime: new Date().toISOString(),
    serverTimestamp: Math.floor(Date.now() / 1000)
  });

  // Add time window tolerance for token validation
  const isValid = authenticator.verify({
    token: req.body.token,
    secret: user.twoFactorSecret,
    window: 4 // Increased tolerance - allow tokens from 4 time steps before/after
  });

  console.log("🔐 Token validation result:", isValid);

  if (!isValid) {
    return next(new AppError("Invalid token or token expired!", 400));
  }

  user.twoFactorEnabled = true;
  await user.save({ validateBeforeSave: false });

  console.log("✅ 2FA enabled successfully for:", user.email);
  res.status(200).json({ status: "SUCCESS" });
});

//* Validate 2FA (authenticator)  **********************************

exports.validate2FAUsingAuthenticator = catchAsync(async (req, res, next) => {
  const { userId, token } = req.body;

  console.log("🔐 Validating 2FA for login:", {
    userId,
    tokenReceived: token
  });

  const user = await User.findById(userId);
  if (!user?.passwordChecked) {
    return next(new AppError("User not found or password not verified!", 401));
  }

  const isValid = authenticator.verify({
    token,
    secret: user.twoFactorSecret,
    window: 2 // Allow tokens from 2 time steps before/after current time
  });

  console.log("🔐 Login 2FA validation result:", isValid);

  if (!isValid) {
    return next(new AppError("Invalid token or token expired!", 401));
  }

  user.passwordChecked = undefined;
  await user.save({ validateBeforeSave: false });
  
  console.log("✅ 2FA login successful for:", user.email);
  sendTokensAndCookies(req, res, user, 200);
});

//* send 2FA code using email or phone *****************************

exports.send2FACodeForEmailOrPhone = catchAsync(async (req, res, next) => {
  const { userId, medium } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found!", 404));
  }

  await createAndSendVerificationCode(res, next, user, "code", medium);
});

//* validate 2FA code (email/phone) ********************************

exports.validate2FACodeUsingEmailOrPhone = catchAsync(
  async (req, res, next) => {
    const user = await verifyCode(req.body.code, next);

    if (!user?.passwordChecked) {
      return next(new AppError("User not found or password not verified!", 404));
    }

    user.passwordChecked = undefined;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save({ validateBeforeSave: false });

    sendTokensAndCookies(req, res, user, 200);
  }
);

//* Disable 2FA  ***************************************************

exports.disable2FA = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found!", 404));
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  await user.save({ validateBeforeSave: false });

  console.log("🔐 2FA disabled for:", user.email);
  res.status(200).json({ status: "SUCCESS" });
});