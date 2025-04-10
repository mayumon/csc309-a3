import { useState } from 'react';
import React from 'react';
import { toast } from 'react-toastify';
import './EventPoints.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
// import token from "../../testing";

function EventPoints({event, setEvent, eventId, setError}) {
    const [points, setPoints] = useState(1);
    const [utorid, setUtorid] = useState('')
    const [showFields, setShowFields] = useState(false);

    const handleAward = async () => {
        const body = {
            type: 'event',
            amount: points
        };

        if(utorid !== '') {
            body.utorid = utorid
        }

        const token = localStorage.getItem('token');

        const res = await fetch(BACKEND_URL + '/events/' + eventId + '/transactions', {
            method: 'POST',
            headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });

        if(res.status === 400) {
            setError('Error 400: User does not exist or points specified exceeds remaining amount');
            setShowFields(false);
        }
        else if(res.status === 401) {
            setError('Error 401: Login expired. Please loging to give points');
            setShowFields(false);
        }
        else if(res.status === 404) {
            setError('Error 404: Event not found');
            setShowFields(false);
        }
        else if(res.status !== 201) {
            setError('Error 500: Internal server error. Please try again later');
            setShowFields(false);
        }
        else {
            const body = await res.json();
            var pointsRemain;

            if(utorid !== '') {
                pointsRemain = event.pointsRemain - points;
            }
            else {
                pointsRemain = event.pointsRemain - (body.length * points);
            }

            setEvent({...event, pointsRemain: pointsRemain});
            setShowFields(false);
        }
    }

    return <div id="eventPointsContainer">
        <button onClick={() => setShowFields(true)}>Award Points</button>
        {showFields && <>
            <label htmlFor="utorid">utorid (leave blank for all guests):</label>
            <input
                type="text"
                id="utorid"
                name="utorid"
                value={utorid}
                onChange={(e) => setUtorid(e.target.value)}
            />
            <label htmlFor="points">Points:</label>
            <input
                type="number"
                id="points"
                name="points"
                value={points}
                min={1}
                onChange={(e) => setPoints(e.target.value)}
            />
            <button onClick={handleAward}>Award Points</button>
            <button onClick={() => setShowFields(false)}>Cancel</button>
        </>}
    </div>
}

export default EventPoints;