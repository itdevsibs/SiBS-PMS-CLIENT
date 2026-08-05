import { apiPost } from "./api";

export function loginUser(payload) {
  return apiPost("/login/user", payload);
}

export default loginUser;
