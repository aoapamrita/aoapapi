export const currentVendorUser = (req, res) => {
  let currentUser = req.currentUser;
  if (currentUser) {
    currentUser = currentUser.role === "vendor" ? currentUser : null;
  }
  res.send({ currentUser });
};
