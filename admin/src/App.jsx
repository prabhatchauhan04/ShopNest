import { BrowserRouter } from "react-router-dom";
import Footer from "./Components/Footer/Footer";
import Navbar from "./Components/Navbar/Navbar";
import Admin from "./Pages/Admin/Admin";

function App() {
  return (
      <div>
        <Navbar />
        <Admin />
        <Footer />
      </div>
  );
}

export default App;
