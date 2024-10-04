import {Outlet} from 'react-router-dom';
import NavBar from '../Components/NavBar';
function RootPage(){
    return(
    <>
    <NavBar/>
    <Outlet/>
    </>);
}
export default RootPage;    