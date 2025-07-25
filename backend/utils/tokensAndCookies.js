const jwt = require("jsonwebtoken");

//* Cookie options *************************************************

const cookieOptions = (maxAge) => ({
  maxAge,
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" && "none",
  secure: process.env.NODE_ENV === "production",
});

//* Create tokens **************************************************

const createTokens = async (user) => {
  const accessToken = jwt.sign(
    { id: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRES_IN }
  );

  user.refreshTokens.push({ token: refreshToken });
  if (!user.active) user.active = true; // To activate deactivated account
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

//* Send Cookies ***************************************************

const sendCookies = (res, accessToken, refreshToken) => {
  res.cookie(
    "access",
    accessToken,
    cookieOptions(process.env.ACCESS_COOKIE_EXPIRES_IN)
  );
  res.cookie(
    "refresh",
    refreshToken,
    cookieOptions(process.env.REFRESH_COOKIE_EXPIRES_IN)
  );
};

//* Create tokens and send Cookies *********************************

const createTokensAndCookies = async (user, res) => {
  const { accessToken, refreshToken } = await createTokens(user);
  sendCookies(res, accessToken, refreshToken);
  

  return accessToken;
};

//* remove cookies *************************************************

const removeCookies = (res) => {
  res.cookie("access", "", cookieOptions(1));
  res.cookie("refresh", "", cookieOptions(1));
};

module.exports = {
  cookieOptions,
  createTokens,
  sendCookies,
  createTokensAndCookies,
  removeCookies,
};
