import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    authState: {
      loggedIn: false,
      bankId: "",
      email: "",
      name: "",
      role: "",
      module: {},
      permissions: {},
      accessLevel: {},
      bankInfo: {},
    },
  },
  reducers: {
    getAuthState: (state, action) => {
      state.authState = action.payload;
    },
  },
});

export const { getAuthState } = authSlice.actions;
export default authSlice.reducer;
