import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./EventsTable.css";

function formatDate(isoDateStr) {
    const dateObj = new Date(isoDateStr);
    return dateObj.toLocaleString();
}

function EventTable({ events }) {
    const { user } = useAuth();
    // const user = {role: 'superuser', currentRole: 'superuser'};
    const navigate = useNavigate();

    if(user.currentRole === 'manager' || user.currentRole === 'superuser') {
        return <table id="eventsDataTable">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Start Time (Toronto Time)</th>
                    <th>End Time (Toronto Time)</th>
                    <th>Capacity</th>
                    <th>Remaining Points</th>
                    <th>Points Awarded</th>
                    <th>Published</th>
                    <th>Guests</th>
                </tr>
            </thead>
            <tbody>
                {events.map(event => (
                    <tr key={event.id} onClick={() => navigate('/events/' + String(event.id))}>
                        <td>{event.name}</td>
                        <td>{event.location}</td>
                        <td>{formatDate(event.startTime)}</td>
                        <td>{formatDate(event.endTime)}</td>
                        <td>{event.capacity}</td>
                        <td>{event.pointsRemain}</td>
                        <td>{event.pointsAwarded}</td>
                        <td>{String(event.published)}</td>
                        <td>{event.numGuests}</td>
                    </tr>
                ))}
            </tbody>
        </table>;
    }
    else {
        return <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Start Time (Toronto Time)</th>
                    <th>End Time (Toronto Time)</th>
                    <th>Capacity</th>
                    <th>Guests</th>
                </tr>
            </thead>
            <tbody>
                {events.map(event => (
                    <tr key={event.id} onClick={() => console.log(event.id)}>
                        <td>{event.name}</td>
                        <td>{event.location}</td>
                        <td>{formatDate(event.startTime)}</td>
                        <td>{formatDate(event.endTime)}</td>
                        <td>{event.capacity}</td>
                        <td>{event.numGuests}</td>
                    </tr>
                ))}
            </tbody>
        </table>;
    }
}

export default EventTable;