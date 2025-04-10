import { useState } from 'react';
import React from 'react';
import { toast } from 'react-toastify';
import './RSVP.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
// import token from "../../testing";

function RSVP({event, setEvent, guests, setGuests, eventId, setError}) {
    const [showFields, setShowFields] = useState(false);

    const handleRSVP = async () => {
        const token = localStorage.getItem('token');

        const res = await fetch(BACKEND_URL + '/events/' + eventId + '/guests/me', {
            method: 'POST',
            headers: {'Authorization': `Bearer ${token}`},
        });

        if(res.status === 400) {
            setError('Error 400: You are already on this guest list');
            setShowFields(false);
        }
        else if(res.status === 401) {
            setError('Error 401: Login expired. Please loging to RSVP');
            setShowFields(false);
        }
        else if(res.status === 410) {
            setError('Error 410: Event is either full or over');
            setShowFields(false);
        }
        else if(res.status !== 201) {
            setError('Error 500: Internal server error. Please try again later');
            setShowFields(false);
        }
        else {
            const body = await res.json();
            setEvent({...event, numGuests: body.numGuests});
            setGuests([...guests, body.guestAdded])
            setShowFields(false);
        }
    }

    return <div id="rsvpContainer">
        <button onClick={() => setShowFields(true)}>RSVP</button>
        {showFields && <>
            <div>Are you sure you'd like to RSVP?</div>
            <button onClick={() => setShowFields(false)}>No</button>
            <button onClick={handleRSVP}>Yes</button>
        </>}
    </div>
}

export default RSVP;