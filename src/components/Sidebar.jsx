import { Link } from "react-router-dom";
import { FiHome, FiInfo, FiStar } from "react-icons/fi";

function Sidebar(){

    return(
        <div className="sidebar">
            <Link to='/'><FiHome /> Home</Link>
            <Link to='/about'><FiInfo /> About</Link>
            <Link to='/features'><FiStar /> Features</Link>
            <Link to='/cases'><FiStar /> Cases</Link>

        </div>
        
    )
}
export default Sidebar;