import { useState } from 'react';
import React from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/AuthContext';
import './EventDeleteOrganizer.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
// import token from "../../testing";

function EventDeleteOrganizer({organizers, setOrganizers, setIsOrganizer, eventId, setError}) {
    const [utorid, setUtorid] = useState('')
    const [showFields, setShowFields] = useState(false);

    const { user } = useAuth();
    // const user = {utorid: 'jarod123', role: 'superuser', currentRole: 'superuser'};

    const handleChange = (e) => {
        setUtorid(e.target.value);
    };

    const handleDelete = async () => {
        if(utorid === '') {
            setError('utorid cannot be blank');
            return;
        }

        const token = localStorage.getItem('token');

        const userRes = await fetch(BACKEND_URL + '/users?name=' + utorid, {
            method: 'GET',
            headers: {'Authorization': `Bearer ${token}`},
        });

        if(userRes.status === 400) {
            setError('Error 400: Bad request');
            return;
        }

        const userBody = await userRes.json();

        if(userBody.count === 0) {
            setError('Error 404: User not found');
            return;
        }

        const userId = String(userBody.results[0].id);

        const res = await fetch(BACKEND_URL + '/events/' + eventId + '/organizers/' + userId, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        });

        if(res.status === 400) {
            setError('Error 400: Bad request');
        }
        else if(res.status === 401) {
            setError('Error 401: Login expired. Please loging to remove guest');
            setShowFields(false);
            setUtorid('');
        }
        else if(res.status === 404) {
            setError('Error 404: User not organizing this event');
            setShowFields(false);
            setUtorid('');
        }
        else if(res.status !== 204) {
            setError('Error 500: Internal server error. Please try again later');
            setShowFields(false);
            setUtorid('');
        }
        else {
            setOrganizers(organizers.filter((organizer) => organizer.utorid !== utorid));
            setShowFields(false);
            setUtorid('');

            if(user.utorid === utorid) {
                setIsOrganizer(false);
            }
        }
    }

    return <div id="deleteOrganizerContainer">
        <button onClick={() => setShowFields(true)}>Remove Organizer</button>
        {showFields && <>
            <label htmlFor="utorid">utorid:</label>
            <input
                type="text"
                id="utorid"
                name="utorid"
                value={utorid}
                onChange={handleChange}
            />
            <button onClick={handleDelete}>Submit</button>
            <button onClick={() => {setUtorid(''); setShowFields(false);}}>Cancel</button>
        </>}
    </div>
}

export default EventDeleteOrganizer;