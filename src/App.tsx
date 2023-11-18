import './App.css';
import { BrowserRouter } from 'react-router-dom';
import { Paths } from "./Paths";


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Paths />
      </BrowserRouter>
    </div>
  );
}

export default App;
