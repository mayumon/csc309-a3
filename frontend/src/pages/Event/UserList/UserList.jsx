import './UserList.css';

function UserList({users, summary}) {
    return <>
        <details id="eventsUserDetails">
            <summary>{summary}</summary>
            <div className="guestsContainer">
                {users.map(user => (
                    <div className="guestDetails" key={user.id}>
                        <div>utorid: {user.utorid}</div>
                        <div>Name: {user.name}</div>
                    </div>
                ))}
            </div>
        </details>
    </>
}

export default UserList;