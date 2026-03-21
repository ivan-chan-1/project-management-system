import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CourseState {
  selectedCourseId: string | null;
}

const initialState: CourseState = {
  selectedCourseId: null,
};

const courseSlice = createSlice({
  name: "subcourse",
  initialState,
  reducers: {
    setCourse: (state, action: PayloadAction<string>) => {
      state.selectedCourseId = action.payload;
    },
    clearCourse: (state) => {
      state.selectedCourseId = null;
    },
  },
});

export const { setCourse, clearCourse } = courseSlice.actions;
export default courseSlice.reducer;
