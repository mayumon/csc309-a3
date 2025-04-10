import "./EventCreateText.css";

function EventCreateText({fieldName, fieldValue, setFieldValue, error, setError, errorMessage}) {
    return <div className="formRow">
        <label htmlFor={fieldName}>{fieldName}:</label>
        <input
            type="text"
            id={fieldName}
            name={fieldName}
            value={fieldValue}
            onChange={(e) => {setFieldValue(e.target.value); setError(false);} }
        />
        {error && <div className="createEventError">{errorMessage}</div>}
    </div>;
}

export default EventCreateText;