// RedemptionRequest.jsx

// Redemption:
// - Users can make a redemption request.
// - Cashiers can process the redemption request.


import React, { useState } from 'react';
import { toast } from 'react-toastify';

import RedemptionQRCode from '../../components/RedemptionQRCode';

const RedemptionRequest = () => {
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [message, setMessage] = useState(null);
    const [redemptionId, setRedemptionId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            type: "redemption",
            amount: Number(amount),
            remark,
        };

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {

                setRedemptionId(data.id.toString());

                toast.success(`Redemption request submitted! Transaction ID: ${data.id}`, {
                    position: "top-right",
                    autoClose: 1500,
                    pauseOnHover: true,
                    closeOnClick: true,
                    hideProgressBar: true,
                });
                setMessage(`Redemption request submitted successfully. Transaction ID: ${data.id}`);

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
            <h2>Redemption Request</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Amount (points to redeem):</label>
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
                <button type="submit">Submit Redemption Request</button>
            </form>

            {redemptionId && (
                <div>
                    <p>Scan this QR code for processing the redemption request:</p>
                    <RedemptionQRCode redemptionId={`redemption:${redemptionId}`} />
                </div>
            )}

        </div>
    );
};

export default RedemptionRequest;
