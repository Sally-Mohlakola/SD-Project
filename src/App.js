import './App.css';
import {Auth} from "./components/auth";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import {Home} from './components/home';


function App() {
 return (<section className="App"><Auth/></section>);
  
}
//
export default App;