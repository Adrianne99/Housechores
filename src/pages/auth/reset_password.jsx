import React from "react";
import axios from "axios";

const Reset_password = () => {
  axios.defaults.withCredentials = true;

  return <div>Reset Password</div>;
};

export default Reset_password;
