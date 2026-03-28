import { signJwt } from "./jwt.utils.js";

const generateToken = (user) => {
  if (!user) {
    throw new Error("User is required.");
  }

  return signJwt({
    userId: user._id,
    email: user.email,
    role: user.role,
  }); 
};

export default generateToken;