import "./App.css";

import { BrowserRouter } from "react-router-dom";
import Router from "./Router";
import { SubcourseProvider } from "./hooks/SubcourseContext";

function App() {
  return (
    <>
      <BrowserRouter>
        <SubcourseProvider>
          <Router />
        </SubcourseProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
