import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import FilterBar from "./FilterBar/FilterBar";
import PromotionsTable from "./PromotionsTable/PromotionsTable";
import "./AllPromotions.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
// import token from "../testing";

function toURLParams(filters) {
    var result = [];
    
    for(var key in filters) {
        if(filters[key] !== '') {
            result.push(`${key}=${filters[key]}`);
        }
    }
    
    return result.join('&');
}
 
function AllPromotions() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [promotions, setPromotions] = useState([]);
    const [filters, setFilters] = useState({
        name: searchParams.get('name') ? searchParams.get('name') : '',
        type: searchParams.get('type') ? searchParams.get('type') : '',
        started: searchParams.get('started') ? searchParams.get('started') : '',
        ended: searchParams.get('ended') ? searchParams.get('ended') : '',
        page: searchParams.get('page') ? searchParams.get('page') : '1',
        limit: searchParams.get('limit') ? searchParams.get('limit') : '10'
    });
    const [error, setError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        async function ueGetPromotions() {
            const token = localStorage.getItem('token');

            const res = await fetch(BACKEND_URL + '/promotions?' + toURLParams(filters), {
                method: 'GET',
                headers: {'Authorization': `Bearer ${token}`},
            });

            if(res.status === 400) {
                setError('Error 400: Please make sure filters are valid and only one of started and ended are selected (if applicable)');
            }
            else if(res.status === 401) {
                setError('Error 401: Please login to see promotions');
            }
            else if(res.status !== 200) {
                setError('Error 500: Internal server error. Please try again later');
            }
            else {
                const body = await res.json();
                setPromotions(body.results);
                setError('');
            }
        }

        ueGetPromotions();
    }, []);

    return <div id="promotionsPageContainer">
        <h1>Promotions</h1>
        <div id="promotionsContainer">
            <FilterBar 
                filters={filters} 
                setFilters={setFilters}
                setError={setError}
                setSearchParams={setSearchParams}
                setPromotions={setPromotions} />
            <PromotionsTable promotions={promotions} />
        </div>
        <button onClick={() => navigate('/promotions')}>
            Manage Promotions    
        </button>
        <p className="eventError">{error}</p>
    </div>;
}

export default AllPromotions;