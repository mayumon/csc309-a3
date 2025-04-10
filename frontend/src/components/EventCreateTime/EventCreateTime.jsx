import "./EventCreateTime.css";

function EventCreateTime({fieldName, fieldValue, setFieldValue, error, setError, errorMessage}) {
    return <div className="formRow">
        <label htmlFor={fieldName}>{fieldName} Time:</label>
        <input
            type="datetime-local"
            id={fieldName}
            name={fieldName}
            value={fieldValue}
            onChange={(e) => {setFieldValue(e.target.value); setError(false);} }
        />
        {error && <div className="createEventError">{errorMessage}</div>}
    </div>;
}

export default EventCreateTime;