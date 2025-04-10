// TransferTransaction.jsx

// Transfer:
// - Users can transfer points to another user.


import React, { useState } from 'react';
import { toast } from 'react-toastify';

const TransferTransaction = () => {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const recipientId = Number(recipient);

        if (isNaN(recipientId)) {
            toast.error("Please enter a valid numeric user ID for the recipient.", {
                position: "top-right",
                autoClose: 1500,
                pauseOnHover: true,
                closeOnClick: true,
                hideProgressBar: true,
            });
            setMessage("Invalid recipient user ID.");
            return;
        }

        const payload = {
            type: "transfer",
            amount: Number(amount),
            remark,
        };

        const token = localStorage.getItem('token');

        try {

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${recipientId}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {

                toast.success(`Transfer successful! Transaction ID: ${data.id}`, {
                    position: "top-right",
                    autoClose: 1500,
                    pauseOnHover: true,
                    closeOnClick: true,
                    hideProgressBar: true,
                });

                setMessage(`Transfer successful! Transaction ID: ${data.id}`);

            } else {
                toast.error(`Error: ${data.error}`, {
                    position: "top-right",
                    autoClose: 1500,
                    pauseOnHover: true,
                    closeOnClick: true,
                    hideProgressBar: true,
                });
                setMessage(`Error: ${data.error}`);
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`, {
                position: "top-right",
                autoClose: 1500,
                pauseOnHover: true,
                closeOnClick: true,
                hideProgressBar: true,
            });
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div>
            <h2>Transfer Points</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Recipient User ID:</label>
                    <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Amount (points):</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        min="1"
                    />
                </div>
                <div>
                    <label>Remark (optional):</label>
                    <input
                        type="text"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                    />
                </div>
                <button type="submit">Submit Transfer</button>
            </form>
        </div>
    );
};

export default TransferTransaction;