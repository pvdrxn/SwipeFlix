import { http } from "./http";

export async function register({ username, email, password }) {
  const { data } = await http.post("/api/auth/register/", {
    username,
    email,
    password,
  });
  return data;
}

export async function login({ username, password }) {
  const { data } = await http.post("/api/auth/token/", { username, password });
  // DRF SimpleJWT returns: { access, refresh }
  return data;
}

export async function me() {
  const { data } = await http.get("/api/auth/me/");
  return data;
}

export async function deleteAccount({ password }) {
  const { data } = await http.post("/api/auth/delete-account/", { password });
  return data;
}

export async function verifyEmail({ email, code }) {
  const { data } = await http.post("/api/auth/verify-email/", { email, code });
  return data;
}

export async function resendCode({ email }) {
  const { data } = await http.post("/api/auth/resend-code/", { email });
  return data;
}

export async function sendPasswordCode() {
  const { data } = await http.post("/api/auth/send-password-code/");
  return data;
}

export async function changePassword({ code, newPassword }) {
  const { data } = await http.post("/api/auth/change-password/", { code, new_password: newPassword });
  return data;
}

export async function sendEmailCode({ newEmail }) {
  const { data } = await http.post("/api/auth/send-email-code/", { new_email: newEmail });
  return data;
}

export async function changeEmail({ code, newEmail }) {
  const { data } = await http.post("/api/auth/change-email/", { code, new_email: newEmail });
  return data;
}

