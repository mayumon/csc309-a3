// AdjustmentTransaction.jsx

// Adjustment:
// - Managers can create adjustment transactions.


import React, { useState } from 'react';
import { toast } from 'react-toastify';

const AdjustmentTransaction = () => {
    const [utorid, setUtorid] = useState('');
    const [amount, setAmount] = useState('');
    const [relatedId, setRelatedId] = useState('');
    const [promotionIds, setPromotionIds] = useState('');
    const [remark, setRemark] = useState('');
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const promoArray =
            promotionIds.trim() === ''
                ? []
                : promotionIds
                    .split(',')
                    .map(id => Number(id.trim()))
                    .filter(num => !isNaN(num));

        const payload = {
            type: "adjustment",
            utorid,
            amount: Number(amount),
            relatedId: Number(relatedId),
            promotionIds: promoArray,
            remark,
        };

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(`Adjustment transaction created! Transaction ID: ${data.id}`, {
                    position: "top-right",
                    autoClose: 1500,
                    pauseOnHover: true,
                    closeOnClick: true,
                    hideProgressBar: true,
                });
                setMessage(`Adjustment transaction created successfully. Transaction ID: ${data.id}`);
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
            <h2>Adjustment Transaction</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Customer UTorID:</label>
                    <input
                        type="text"
                        value={utorid}
                        onChange={(e) => setUtorid(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Adjustment Amount (points):</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Related Transaction ID:</label>
                    <input
                        type="number"
                        value={relatedId}
                        onChange={(e) => setRelatedId(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Promotion IDs (comma separated, optional):</label>
                    <input
                        type="text"
                        value={promotionIds}
                        onChange={(e) => setPromotionIds(e.target.value)}
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
                <button type="submit">Submit Adjustment</button>
            </form>
        </div>
    );
};

export default AdjustmentTransaction;