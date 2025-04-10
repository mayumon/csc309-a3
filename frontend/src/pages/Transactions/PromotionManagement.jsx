// PromotionManagement.jsx

// Promotion Management:
// - Managers can create, update, and delete promotions.


import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const PromotionManagement = () => {
    const [promotions, setPromotions] = useState([]);
    const [form, setForm] = useState({
        id: null,
        name: '',
        description: '',
        type: 'automatic',
        startTime: '',
        endTime: '',
        minSpending: '',
        rate: '',
        points: ''
    });
    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState('');


    const token = localStorage.getItem('token');


    const fetchPromotions = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/promotions?page=1&limit=100`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const data = await response.json();
            setPromotions(data.results || []);
        } catch (err) {
            setMessage(err.message);
            toast.error(`Error fetching promotions: ${err.message}`, {
                position: "top-right",
                autoClose: 1500,
                hideProgressBar: true,
            });
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);


    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            name: form.name,
            description: form.description,
            type: form.type,

            // convert datetime-local string to ISO string
            startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
            endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
            ...(form.minSpending !== '' && { minSpending: Number(form.minSpending) }),
            ...(form.rate !== '' && { rate: Number(form.rate) }),
            ...(form.points !== '' && { points: Number(form.points) }),
        };

        let url, method;
        if (editing) {
            url = `${import.meta.env.VITE_BACKEND_URL}/promotions/${form.id}`;
            method = 'PATCH';
        } else {
            url = `${import.meta.env.VITE_BACKEND_URL}/promotions`;
            method = 'POST';
        }

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(
                    editing
                        ? 'Promotion updated successfully!'
                        : 'Promotion created successfully!',
                    {
                        position: "top-right",
                        autoClose: 1500,
                        hideProgressBar: true,
                        pauseOnHover: true,
                        closeOnClick: true,
                    }
                );

                setMessage(editing ? 'Promotion updated successfully!' : 'Promotion created successfully!');
                setForm({
                    id: null,
                    name: '',
                    description: '',
                    type: 'automatic',
                    startTime: '',
                    endTime: '',
                    minSpending: '',
                    rate: '',
                    points: ''
                });
                setEditing(false);

                fetchPromotions();

            } else {
                toast.error(`Error: ${data.error}`, {
                    position: "top-right",
                    autoClose: 1500,
                    hideProgressBar: true,
                    pauseOnHover: true,
                    closeOnClick: true,
                });
                setMessage(`Error: ${data.error}`);
            }
        } catch (err) {
            toast.error(`Error: ${err.message}`, {
                position: "top-right",
                autoClose: 1500,
                hideProgressBar: true,
                pauseOnHover: true,
                closeOnClick: true,
            });
            setMessage(`Error: ${err.message}`);
        }
    };

    const handleEdit = (promotion) => {
        setEditing(true);
        setForm({
            id: promotion.id,
            name: promotion.name || '',
            description: promotion.description || '',
            type: promotion.type || 'automatic',

            // convert ISO to datetime-local format (YYYY-MM-DDTHH:MM)
            startTime: promotion.startTime ? new Date(promotion.startTime).toISOString().slice(0,16) : '',
            endTime: promotion.endTime ? new Date(promotion.endTime).toISOString().slice(0,16) : '',
            minSpending: promotion.minSpending !== null && promotion.minSpending !== undefined ? promotion.minSpending : '',
            rate: promotion.rate !== null && promotion.rate !== undefined ? promotion.rate : '',
            points: promotion.points !== null && promotion.points !== undefined ? promotion.points : ''
        });
    };

    const handleCancelEdit = () => {
        setEditing(false);
        setForm({
            id: null,
            name: '',
            description: '',
            type: 'automatic',
            startTime: '',
            endTime: '',
            minSpending: '',
            rate: '',
            points: ''
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/promotions/${id}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            if (response.status === 204) {
                toast.success('Promotion deleted successfully.', {
                    position: "top-right",
                    autoClose: 1500,
                    hideProgressBar: true,
                    pauseOnHover: true,
                    closeOnClick: true,
                });
                setMessage('Promotion deleted successfully.');
                fetchPromotions();
            } else {
                const data = await response.json();
                toast.error(`Error: ${data.error}`, {
                    position: "top-right",
                    autoClose: 1500,
                    hideProgressBar: true,
                    pauseOnHover: true,
                    closeOnClick: true,
                });
                setMessage(`Error: ${data.error}`);
            }
        } catch (err) {
            toast.error(`Error: ${err.message}`, {
                position: "top-right",
                autoClose: 1500,
                hideProgressBar: true,
                pauseOnHover: true,
                closeOnClick: true,
            });
            setMessage(`Error: ${err.message}`);
        }
    };

    return (
        <div>
            <h2>Promotion Management</h2>
            {message && <p>{message}</p>}

            <form onSubmit={handleSubmit}>
                <h3>{editing ? 'Edit Promotion' : 'Create Promotion'}</h3>
                <div>
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleFormChange}
                        required
                    />
                </div>
                <div>
                    <label>Description:</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleFormChange}
                        required
                    />
                </div>
                <div>
                    <label>Type:</label>
                    <select
                        name="type"
                        value={form.type}
                        onChange={handleFormChange}
                        required
                    >
                        <option value="automatic">Automatic</option>
                        <option value="one-time">One-time</option>
                    </select>
                </div>
                <div>
                    <label>Start Time:</label>
                    <input
                        type="datetime-local"
                        name="startTime"
                        value={form.startTime}
                        onChange={handleFormChange}
                        required
                    />
                </div>
                <div>
                    <label>End Time:</label>
                    <input
                        type="datetime-local"
                        name="endTime"
                        value={form.endTime}
                        onChange={handleFormChange}
                        required
                    />
                </div>
                <div>
                    <label>Min Spending (optional):</label>
                    <input
                        type="number"
                        name="minSpending"
                        value={form.minSpending}
                        onChange={handleFormChange}
                        min="0"
                    />
                </div>
                <div>
                    <label>Rate (optional):</label>
                    <input
                        type="number"
                        step="any"
                        name="rate"
                        value={form.rate}
                        onChange={handleFormChange}
                        min="0"
                    />
                </div>
                <div>
                    <label>Points (optional):</label>
                    <input
                        type="number"
                        name="points"
                        value={form.points}
                        onChange={handleFormChange}
                        min="0"
                    />
                </div>
                <button type="submit">{editing ? 'Update Promotion' : 'Create Promotion'}</button>
                {editing && (
                    <button type="button" onClick={handleCancelEdit}>
                        Cancel
                    </button>
                )}
            </form>

            <hr />

            <h3>Existing Promotions</h3>
            {promotions.length === 0 ? (
                <p>No promotions found.</p>
            ) : (
                <ul>
                    {promotions.map((promotion) => (
                        <li key={promotion.id} style={{ marginBottom: '1rem', borderBottom: '1px solid #ccc' }}>
                            <strong>{promotion.name}</strong> ({promotion.type})<br />
                            {promotion.description && (
                                <>
                                    <em>{promotion.description}</em><br />
                                </>
                            )}
                            <span>
                Starts: {new Date(promotion.startTime).toLocaleString()}
              </span>
                            <br />
                            <span>
                Ends: {new Date(promotion.endTime).toLocaleString()}
              </span>
                            <br />
                            {promotion.minSpending !== null && promotion.minSpending !== undefined && (
                                <span>Min Spending: {promotion.minSpending}</span>
                            )}
                            <br />
                            {promotion.rate !== null && promotion.rate !== undefined && (
                                <span>Rate: {promotion.rate}</span>
                            )}
                            <br />
                            {promotion.points !== null && promotion.points !== undefined && (
                                <span>Points: {promotion.points}</span>
                            )}
                            <br />
                            <button onClick={() => handleEdit(promotion)}>Edit</button>{' '}
                            <button onClick={() => handleDelete(promotion.id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PromotionManagement;