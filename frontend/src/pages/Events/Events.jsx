import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import FilterBar from "./FilterBar/FilterBar";
import EventsTable from "./EventsTable/EventsTable";
import "./Events.css";

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
 
function Events() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [filters, setFilters] = useState({
        name: searchParams.get('name') ? searchParams.get('name') : '',
        location: searchParams.get('location') ? searchParams.get('location') : '',
        started: searchParams.get('started') ? searchParams.get('started') : '',
        ended: searchParams.get('ended') ? searchParams.get('ended') : '',
        showFull: searchParams.get('showFull') ? searchParams.get('showFull') : 'false',
        published: searchParams.get('published') ? searchParams.get('published') : '',
        page: searchParams.get('page') ? searchParams.get('page') : '1',
        limit: searchParams.get('limit') ? searchParams.get('limit') : '10'
    });
    const [showFilters, setShowFilters] = useState(true);
    const [error, setError] = useState('');

    const { user } = useAuth();
    // const user = {role: 'superuser', currentRole: 'superuser'};

    const navigate = useNavigate();

    const resetFilters = () => {
        const obj = {
            name: '',
            location: '',
            started: '',
            ended: '',
            showFull: 'true',
            published: '',
            page: '1',
            limit: '10'
        };
        
        setFilters({...obj});
        setSearchParams({...obj});
    };

    const handleChangePage = async (page) => {
        const token = localStorage.getItem('token');
        resetFilters();

        var res;

        if(page === 'all') {
            setShowFilters(true);

            res = await fetch(BACKEND_URL + '/events', {
                method: 'GET',
                headers: {'Authorization': `Bearer ${token}`},
            });
        }
        else if(page === 'attend') {
            setShowFilters(false);

            res = await fetch(BACKEND_URL + '/events/myattended', {
                method: 'GET',
                headers: {'Authorization': `Bearer ${token}`},
            });
        }
        else {
            setShowFilters(false);

            res = await fetch(BACKEND_URL + '/events/myorganized', {
                method: 'GET',
                headers: {'Authorization': `Bearer ${token}`},
            });
        }

        if(res.status === 401) {
            setError('Error 401: Please login to see events');
        }
        if(res.status !== 200) {
            setError('Error 500: Internal server error');
        }
        else {
            const body = await res.json();
            setEvents(body.results);
            setError('');
        }
    }

    useEffect(() => {
        async function ueGetEvents() {
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
        }

        ueGetEvents();
    }, []);

    return <div id="eventsPageContainer">
        <h1>Events</h1>
        <div id="eventsLinksContainer">
            <button onClick={() => handleChangePage('all')}>
                All Events
            </button>
            <button onClick={() => handleChangePage('attend')}>
                Events I'm Attending
            </button>
            <button onClick={() => handleChangePage('organize')}>
                Events I'm Organizing
            </button>
        </div>
        <div id="eventsContainer">
            {showFilters && <FilterBar 
                filters={filters} 
                setFilters={setFilters}
                setError={setError}
                setSearchParams={setSearchParams}
                setEvents={setEvents} />}
            <EventsTable events={events} />
        </div>
        {(user.currentRole === 'manager' || user.currentRole === 'superuser') && 
        <button onClick={() => navigate('/events/create')}>
            Create Event    
        </button>}
        <p className="eventError">{error}</p>
    </div>;
}

export default Events;