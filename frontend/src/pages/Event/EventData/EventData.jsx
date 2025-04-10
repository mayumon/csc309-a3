import './EventData.css';

function formatDate(isoDateStr) {
    const dateObj = new Date(isoDateStr);
    return dateObj.toLocaleString();
}

function EventData({event, includeExtra}) {
    return <div id="eventDataContainer">
        <div>Description: {event.description}</div>
        <div>Location: {event.location}</div>
        <div>Start Time: {formatDate(event.startTime)}</div>
        <div>End Time: {formatDate(event.endTime)}</div>
        <div>Capacity: {event.capacity}</div>
        <div>Guests: {event.numGuests}</div>
        {includeExtra && <>
            <div>Remaining Points: {event.pointsRemain}</div>
            <div>Awarded Points: {event.pointsAwarded}</div>
            <div>Published: {String(event.published)}</div>
        </>}
    </div>
}

export default EventData;