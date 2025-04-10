import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import './Event.css';
import EventData from './EventData/EventData';
import UserList from './UserList/UserList';
import RSVP from './RSVP/RSVP';
import EventDelete from './EventDelete/EventDelete';
import EventAddGuest from './EventAddGuest/EventAddGuest';
import EventAddOrganizer from './EventAddOrganizer/EventAddOrganizer';
import EventDeleteGuest from './EventDeleteGuest/EventDeleteGuest';
import EventPoints from "./EventPoints/EventPoints";
import EventDeleteOrganizer from "./EventDeleteOrganizer/EventDeleteOrganizer";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
// import token from "../testing";

function Event() {
    const [event, setEvent] = useState({});
    const [guests, setGuests] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [isOrganizer, setIsOrganizer] = useState(false);
    const [error, setError] = useState('');

    const { user } = useAuth();
    // const user = {utorid: 'jarod123', role: 'superuser', currentRole: 'superuser'};
    const { eventId } = useParams();
    const navigate = useNavigate();

    const hasManagerClearance = (user.currentRole === 'manager' || user.currentRole === 'superuser');

    const handlePublish = async () => {
        const token = localStorage.getItem('token');

        const res = await fetch(BACKEND_URL + '/events/' + eventId, {
            method: 'PATCH',
            headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
            body: JSON.stringify({published: true}),
        });

        if(res.status !== 200) {
            setError('Error 500: Internal Server Error. Please try again later');
        }
        else {
            setEvent({...event, published: true});
            setError('');
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
                setError('Error 401: Please login to see events');
            }
            else if(res.status === 404) {
                setError('Error 404: Event not found');
            }
            else if(res.status !== 200) {
                setError('Error 500: Internal server error. Please try again later');
            }
            else {
                const body = await res.json();
                setEvent(body);
                setGuests(body.guests ? body.guests : []);
                setOrganizers(body.organizers);

                for(var organizer of body.organizers) {
                    if(user.utorid === organizer.utorid) {
                        setIsOrganizer(true);
                    }
                }

                setError('');
            }
        }

        getEvent();
    }, []);

    return <div id="singleEventContainer">
        <h1>{event.name}</h1>
        <div id="singleEventInfo">
            <EventData event={event} includeExtra={hasManagerClearance || isOrganizer} />
            {(hasManagerClearance || isOrganizer) && <>
                <UserList users={guests} summary={"Guest List"} />
                <UserList users={organizers} summary={"Organizer List"} />
            </>}
        </div>
        {!(hasManagerClearance || isOrganizer) && <>
            <RSVP event={event} setEvent={setEvent}
                    guests={guests} setGuests={setGuests}
                    eventId={eventId} setError={setError}/>
        </>}
        {(hasManagerClearance && !event.published) && <button onClick={handlePublish}>
            Publish
        </button>}
        {(hasManagerClearance || isOrganizer) && <>
            <button onClick={() => navigate('/events/' + eventId + '/update')}>Edit Event</button>
            <EventAddGuest event={event} setEvent={setEvent}
                            guests={guests} setGuests={setGuests}
                            eventId={eventId} setError={setError}/>
        </>}
        {hasManagerClearance && <>
            <EventAddOrganizer setOrganizers={setOrganizers} eventId={eventId} setError={setError} />
            <EventDeleteGuest event={event} setEvent={setEvent}
                                guests={guests} setGuests={setGuests}
                                eventId={eventId} setError={setError} />
            <EventDeleteOrganizer organizers={organizers} setOrganizers={setOrganizers}
                                    setIsOrganizer={setIsOrganizer} eventId={eventId} setError={setError}/>
            <EventDelete eventId={eventId} setError={setError} />
        </>}
        {(hasManagerClearance || isOrganizer) && <>
            <EventPoints event={event} setEvent={setEvent} eventId={eventId} setError={setError}/>
        </>}
        <button onClick={() => navigate('/events')}>Back to Events</button>
        <p className="eventError">{error}</p>
    </div>
}

export default Event;