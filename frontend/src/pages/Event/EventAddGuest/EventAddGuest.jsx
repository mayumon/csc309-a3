import { useState } from 'react';
import React from 'react';
import { toast } from 'react-toastify';
import './EventAddGuest.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
// import token from "../../testing";

function EventAddGuest({event, setEvent, guests, setGuests, eventId, setError}) {
    const [utorid, setUtorid] = useState('')
    const [showFields, setShowFields] = useState(false);

    const handleChange = (e) => {
        setUtorid(e.target.value);
    };

    const handleAdd = async () => {
        if(utorid === '') {
            setError('utorid cannot be blank');
            return;
        }

        const token = localStorage.getItem('token');

        const res = await fetch(BACKEND_URL + '/events/' + eventId + '/guests', {
            method: 'POST',
            headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
            body: JSON.stringify({utorid: utorid})
        });

        if(res.status === 400) {
            setError('Error 400: Make sure user exists and is not already a guest or organizer');
        }
        else if(res.status === 401) {
            setError('Error 401: Login expired. Please loging to add guest');
            setShowFields(false);
            setUtorid('');
        }
        else if(res.status === 404) {
            setError('Error 404: Event not yet published');
            setShowFields(false);
            setUtorid('');
        }
        else if(res.status === 410) {
            setError('Error 410: Event is either over or full');
            setShowFields(false);
            setUtorid('');
        }
        else if(res.status !== 201) {
            setError('Error 500: Internal server error. Please try again later');
            setShowFields(false);
            setUtorid('');
        }
        else {
            const body = await res.json();
            setEvent({...event, numGuests: body.numGuests});
            setGuests([...guests, body.guestAdded])
            setShowFields(false);
            setUtorid('');
        }
    }

    return <div id="addGuestContainer">
        <button onClick={() => setShowFields(true)}>Add Guest</button>
        {showFields && <>
            <label htmlFor="utorid">utorid:</label>
            <input
                type="text"
                id="utorid"
                name="utorid"
                value={utorid}
                onChange={handleChange}
            />
            <button onClick={handleAdd}>Submit</button>
            <button onClick={() => {setUtorid(''); setShowFields(false);}}>Cancel</button>
        </>}
    </div>
}

export default EventAddGuest;