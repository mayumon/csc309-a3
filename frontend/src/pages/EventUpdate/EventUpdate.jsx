import { useEffect, useState } from "react";
import EventCreateText from "../../components/EventCreateText/EventCreateText";
import EventCreateTime from "../../components/EventCreateTime/EventCreateTime";
import { useNavigate, useParams } from "react-router-dom";
import "./EventUpdate.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
// import token from "../testing";

function formatDate(utcDateStr) {
    const localDateStr = (new Date(utcDateStr)).toLocaleString();
    if(localDateStr.charAt(19) === ' ') {
        return localDateStr.slice(0, 10) + 'T0' + localDateStr.slice(12, 19);
    }
    else {
        return localDateStr.slice(0, 10) + 'T0' + localDateStr.slice(12, 20);
    }
}

function EventUpdate() {
    const [originalEvent, setOriginalEvent] = useState({});
    const [updatedEvent, setUpdatedEvent] = useState({});
    const [startPassed, setStartPassed] = useState(false);
    const [endPassed, setEndPassed] = useState(false);
    const [error, setError] = useState('');

    const { eventId } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async () => {
        const startTimeDate = new Date(updatedEvent.startTime);
        const endTimeDate = new Date(updatedEvent.endTime);
        const now = new Date();

        if(startPassed) {
            if(originalEvent.name !== updatedEvent.name 
                || originalEvent.description !== updatedEvent.description 
                || originalEvent.location !== updatedEvent.location 
                || originalEvent.startTime !== updatedEvent.startTime
                || originalEvent.capacity !== updatedEvent.capacity) {
                    setError('Cannot change name, description, locaton, start time or capacity after event has started');
                    return;
            }
        }

        if(endPassed) {
            if(originalEvent.endTime !== updatedEvent.endTime) {
                setError('Cannot change end time after event has ended');
                return;
            }
        }

        if(startTimeDate <= now) {
            setError('Start time cannot be in the past');
            return;
        }

        if(endTimeDate <= startTimeDate) {
            setError('End time cannot be before start time');
            return;
        }

        const capacityNum = parseInt(updatedEvent.capacity, 10);
        const pointsNum = parseInt(updatedEvent.points, 10);

        if(updatedEvent.capacity !== '' && (isNaN(capacityNum) || capacityNum < Math.max(1, originalEvent.numGuests))) {
            setError('Capacity must be blank or a positive integer greater than or equal to the current number of guests');
            return;
        }

        if(isNaN(pointsNum) || points < Math.max(1, originalEvent.pointsAwarded)) {
            setError('Points must be a positive integer greater than or equal to the current number of awarded points');
            return;
        }

        const body = {};

        if(originalEvent.name !== updatedEvent.name) {
            body.name = updatedEvent.name;
        }

        if(originalEvent.description !== updatedEvent.description) {
            body.description = updatedEvent.description;
        }

        if(originalEvent.location !== updatedEvent.location) {
            body.location = updatedEvent.location;
        }

        if(originalEvent.startTime !== updatedEvent.startTime) {
            body.startTime = (new Date(updatedEvent.startTime)).toISOString();
        }

        if(originalEvent.endTime !== updatedEvent.endTime) {
            body.endTime = (new Date(updatedEvent.endTime)).toISOString();
        }

        if(originalEvent.capacity !== updatedEvent.capacity) {
            if(updatedEvent.capacity === '') {
                body.capacity = null;
            }
            else {
                body.capacity = updatedEvent.capacity;
            }
        }

        if(originalEvent.points !== updatedEvent.points) {
            body.points = updatedEvent.points;
        }

        const token = localStorage.getItem('token');

        const res = await fetch(BACKEND_URL + '/events/' + eventId, {
            method: 'PATCH',
            headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });

        if(res.status === 400) {
            setError('Error 400: Please make sure all fields are valid');
        }
        else if(res.status === 401) {
            setError('Error 401: Please login to update event');
        }
        else if(res.status !== 200) {
            setError('Error 500: Internal server error. Please try again later');
        }
        else {
            setError('');
            navigate('/events/' + eventId);
        }
    };

    useEffect(() => {
        async function getEvent() {
            const token = localStorage.getItem('token');

            const res = await fetch(BACKEND_URL + '/events/' + eventId, {
                method: 'GET',
                headers: {'Authorization': `Bearer ${token}`},
            });

            if(res.status === 401) {
                setError('Error 401: Please login to update event');
            }
            else if(res.status === 404) {
                setError('Error 404: Event not found');
            }
            else if(res.status !== 200) {
                setError('Error 500: Internal server error. Please try again later');
            }
            else {
                const body = await res.json();
                setOriginalEvent({
                    ...body, 
                    startTime: formatDate(body.startTime),
                    endTime: formatDate(body.endTime),
                    capacity: (body.capacity === null ? '' : body.capacity), 
                    points: body.pointsAwarded + body.pointsRemain
                });
                setUpdatedEvent({
                    ...body, 
                    startTime: formatDate(body.startTime),
                    endTime: formatDate(body.endTime),
                    capacity: (body.capacity === null ? '' : body.capacity),
                    points: body.pointsAwarded + body.pointsRemain
                });

                const now = new Date();

                if(new Date(body.startTime) <= now) {
                    setStartPassed(true);
                }

                if(new Date(body.endTime) <= now)

                setError('');
            }
        }

        getEvent();
    }, []);

    return <div id="eventUpdateContainer">
        <h1>Update Event {eventId}</h1>
        <div id="eventUpdateForm">
            <EventCreateText fieldName={"Name"} fieldValue={updatedEvent.name} 
                                setFieldValue={(name) => setUpdatedEvent({...updatedEvent, name: name})}
                                error={""} setError={() => {}} errorMessage={""} />

            <EventCreateText fieldName={"Description"} fieldValue={updatedEvent.description} 
                                setFieldValue={(description) => setUpdatedEvent({...updatedEvent, description: description})}
                                error={""} setError={() => {}} errorMessage={""} />

            <EventCreateText fieldName={"Location"} fieldValue={updatedEvent.location} 
                                setFieldValue={(location) => setUpdatedEvent({...updatedEvent, location: location})}
                                error={""} setError={() => {}} errorMessage={""} />

            <EventCreateTime fieldName={"Start"} fieldValue={updatedEvent.startTime} 
                                setFieldValue={(startTime) => setUpdatedEvent({...updatedEvent, startTime: startTime})}
                                error={""} setError={() => {}} errorMessage={""} />

            <EventCreateTime fieldName={"End"} fieldValue={updatedEvent.endTime} 
                                setFieldValue={(endTime) => setUpdatedEvent({...updatedEvent, endTime: endTime})}
                                error={""} setError={() => {}} errorMessage={""} />

            <EventCreateText fieldName={"Capacity"} fieldValue={updatedEvent.capacity} 
                                setFieldValue={(capacity) => setUpdatedEvent({...updatedEvent, capacity: capacity})}
                                error={""} setError={() => {}} errorMessage={""} />

            <div className="formRow">
                <label htmlFor="points">Points:</label>
                <input
                    type="number"
                    id="points"
                    name="points"
                    value={updatedEvent.points}
                    onChange={(e) => setUpdatedEvent({...updatedEvent, points: e.target.value})}
                    min={1}
                />
            </div>
            <button onClick={handleSubmit}>Submit</button>
            <button onClick={() => navigate('/events/' + eventId)}>Cancel</button>
        </div>
        <div className="eventError">{error}</div>
    </div>;
}

export default EventUpdate;