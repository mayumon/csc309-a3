import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EventDelete.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
// import token from "../../testing";

function EventDelete({eventId, setError}) {
    const [showWarning, setShowWarning] = useState(false);

    const navigate = useNavigate();

    const handleDelete = async () => {
        const token = localStorage.getItem('token');

        const res = await fetch(BACKEND_URL + '/events/' + eventId, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`},
        });

        if(res.status === 401) {
            setError('Error 401: Login expired. Please login to delete event');
            setShowWarning(false);
        }
        else if(res.status === 400) {
            setError('Error 400: Event already published');
            setShowWarning(false);
        }
        else if(res.status !== 204) {
            setError('Error 500: Internal server error. Please try again later');
            setShowWarning(false);
        }
        else {
            navigate('/events');
        }
    }

    return <div id="eventDeleteContainer">
        <button onClick={() => setShowWarning(true)}>Delete Event</button>
        {showWarning && <>
            <div>Are you sure?</div>
            <button onClick={() => setShowWarning(false)}>No</button>
            <button onClick={handleDelete}>Yes</button>
        </>}
    </div>
}

export default EventDelete;