import { configureStore } from "@reduxjs/toolkit";
import courseReducer from "./courseSlice";

export const store = configureStore({
  reducer: {
    course: courseReducer, // storing current courseId
  },
});

// Infer RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
