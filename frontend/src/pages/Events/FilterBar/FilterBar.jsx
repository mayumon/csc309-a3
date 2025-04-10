import { useAuth } from '../../../contexts/AuthContext';
import './FilterBar.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
// import token from "../../testing";

function toURLParams(filters) {
    var result = [];
    
    for(var key in filters) {
        if(filters[key] !== '') {
            result.push(`${key}=${filters[key]}`);
        }
    }
    
    return result.join('&');
}

function FilterBar({ filters, setFilters, setError, setSearchParams, setEvents }) {
    const { user } = useAuth();
    // const user = {role: 'superuser', currentRole: 'superuser'};

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    const nextPage = async () => {
        setFilters({...filters, page: String(parseInt(filters.page, 10) + 1)});
        await handleSubmit();
    }

    const handleSubmit = async () => {
        setSearchParams(filters);

        const token = localStorage.getItem('token');

        const res = await fetch(BACKEND_URL + '/events?' + toURLParams(filters), {
            method: 'GET',
            headers: {'Authorization': `Bearer ${token}`},
        });

        if(res.status === 400) {
            setError('Error 400: Please make sure filters are valid and only one of started and ended are selected');
        }
        else if(res.status === 401) {
            setError('Error 401: Please login to see events');
        }
        else if(res.status !== 200) {
            setError('Error 500: Internal server error. Please try again later');
        }
        else {
            const body = await res.json();
            setEvents(body.results);
            setError('');
        }
    };

    return <>
        <form id="filterForm" onSubmit={handleSubmit}>
            <div className="formDiv">
                <label htmlFor="name">Name:</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={filters.name}
                    onChange={handleChange}
                />
            </div>
            <div className="formDiv">
                <label htmlFor="location">Location:</label>
                <input
                    type="text"
                    id="location"
                    name="location"
                    value={filters.location}
                    onChange={handleChange}
                />
            </div>
            <div className="formDiv">
                <label htmlFor="started">Has Started:</label>
                <select 
                    id="started"
                    name="started"
                    value={filters.started}
                    onChange={handleChange}>
                        <option value="true">Has started</option>
                        <option value="false">Has not started</option>
                        <option value="">Either</option>
                </select>
            </div>
            <div className="formDiv">
                <label htmlFor="ended">Has Ended:</label>
                <select 
                    id="ended"
                    name="ended"
                    value={filters.ended}
                    onChange={handleChange}>
                        <option value="true">Has ended</option>
                        <option value="false">Has not ended</option>
                        <option value="">Either</option>
                </select>
            </div>
            <div className="formDiv">
                <label htmlFor="showFull">Show full events:</label>
                <select 
                    id="showFull"
                    name="showFull"
                    value={filters.showFull}
                    onChange={handleChange}>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                </select>
            </div>
            {(user.currentRole === "manager" || user.currentRole === "superuser") && 
                <div className="formDiv">
                    <label htmlFor="published">Published:</label>
                    <select 
                        id="published"
                        name="published"
                        value={filters.published}
                        onChange={handleChange}>
                            <option value="true">Has been published</option>
                            <option value="false">Has not been published</option>
                            <option value="">Either</option>
                    </select>
                </div>
            }
            <div className="formDiv">
                <label htmlFor="page">Page:</label>
                <input
                    type="number"
                    id="page"
                    name="page"
                    value={filters.page}
                    min={1}
                    onChange={handleChange}
                />
            </div>
            <div className="formDiv">
                <label htmlFor="limit">Events per page:</label>
                <input
                    type="number"
                    id="limit"
                    name="limit"
                    value={filters.limit}
                    min={1}
                    onChange={handleChange}
                />
            </div>
            <div className="btn-container">
                <button type="submit">Search</button>
            </div>
            <button onClick={nextPage}>Next Page</button>
        </form>
    </>;
}

export default FilterBar;