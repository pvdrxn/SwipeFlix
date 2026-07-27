import { http } from "./http";

export async function register({ username, password }) {
  const { data } = await http.post("/api/auth/register/", {
    username,
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

export async function changeUsername({ newUsername, password }) {
  const { data } = await http.post("/api/auth/change-username/", {
    new_username: newUsername,
    password,
  });
  return data;
}

export async function deleteAccount({ password }) {
  const { data } = await http.post("/api/auth/delete-account/", { password });
  return data;
}



