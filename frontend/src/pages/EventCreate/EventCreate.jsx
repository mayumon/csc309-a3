import { useState } from "react";
import EventCreateText from "../../components/EventCreateText/EventCreateText";
import EventCreateTime from "../../components/EventCreateTime/EventCreateTime";
import "./EventCreate.css";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
// import token from "../testing";

function EventCreate() {
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState(false);
    const [description, setDescription] = useState('');
    const [descriptionError, setDescriptionError] = useState(false);
    const [location, setLocation] = useState('');
    const [locationError, setLocationError] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [startTimeError, setStartTimeError] = useState(false);
    const [endTime, setEndTime] = useState('');
    const [endTimeError, setEndTimeError] = useState(false);
    const [capacity, setCapacity] = useState('');
    const [capacityError, setCapacityError] = useState(false);
    const [points, setPoints] = useState(1);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async () => {
        var validData = true;

        if(name === '') {
            validData = false;
            setNameError(true);
        }

        if(description === '') {
            validData = false;
            setDescriptionError(true);
        }

        if(location === '') {
            validData = false;
            setLocationError(true);
        }

        const startTimeDate = new Date(startTime);
        const endTimeDate = new Date(endTime);
        const now = new Date();

        if(startTime === '' || startTimeDate <= now) {
            validData = false;
            setStartTimeError(true);
        }

        if(endTime === '' || endTimeDate <= startTimeDate) {
            validData = false;
            setEndTimeError(true);
        }

        if(capacity !== '' && isNaN(parseInt(capacity, 10))) {
            validData = false;
            setCapacityError(true);
        }

        if(!validData) {
            return;
        }

        const body = {
            name: name,
            description: description,
            location: location,
            startTime: startTimeDate.toISOString(),
            endTime: endTimeDate.toISOString(),
            points: points
        }

        if(capacity !== '') {
            body.capacity = parseInt(capacity, 10)
        }

        const token = localStorage.getItem('token');

        const res = await fetch(BACKEND_URL + '/events', {
            method: 'POST',
            headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });

        if(res.status === 400) {
            setError('Error 400: Please make sure all fields are valid');
        }
        else if(res.status === 401) {
            setError('Error 401: Please login to see create event');
        }
        else if(res.status !== 201) {
            setError('Error 500: Internal server error. Please try again later');
        }
        else {
            setError('');
            navigate('/events');
        }
    };

    return <div id="eventCreateContainer">
        <h1>Create A New Event</h1>
        <div id="eventCreateForm">
            <EventCreateText fieldName={"Name"} fieldValue={name} setFieldValue={setName}
                error={nameError} setError={setNameError} errorMessage={"This field is required"} />

            <EventCreateText fieldName={"Description"} fieldValue={description} setFieldValue={setDescription}
                error={descriptionError} setError={setDescriptionError} errorMessage={"This field is required"} />

            <EventCreateText fieldName={"Location"} fieldValue={location} setFieldValue={setLocation}
                error={locationError} setError={setLocationError} errorMessage={"This field is required"} />

            <EventCreateTime fieldName={"Start"} fieldValue={startTime} setFieldValue={setStartTime}
                error={startTimeError} setError={setStartTimeError} errorMessage={"Must be in the future"} />

            <EventCreateTime fieldName={"End"} fieldValue={endTime} setFieldValue={setEndTime}
                error={endTimeError} setError={setEndTimeError} errorMessage={"Must be after start time"} />

            <EventCreateText fieldName={"Capacity"} fieldValue={capacity} setFieldValue={setCapacity}
                error={capacityError} setError={setCapacityError} errorMessage={"This field must be blank or a number"} />

            <div className="formRow">
                <label htmlFor="points">Points:</label>
                <input
                    type="number"
                    id="points"
                    name="points"
                    value={points}
                    onChange={(e) => {setPoints(e.target.value);} }
                    min={1}
                    required
                />
            </div>
            <button onClick={handleSubmit}>Submit</button>
        </div>
        <div className="eventError">{error}</div>
    </div>;
}

export default EventCreate;