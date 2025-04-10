// PurchaseTransaction.jsx

// Purchase:
// - Cashiers can create purchase transactions.
// - Cashiers can correctly apply promotions to transactions.

import React, { useState } from 'react';
import { toast } from 'react-toastify';

const PurchaseTransaction = () => {
    const [utorid, setUtorid] = useState('');
    const [spent, setSpent] = useState('');
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
            type: "purchase",
            utorid,
            spent,
            promotionIds: promoArray,
            remark
        };

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(`Transaction successful! Points earned: ${data.earned}`, {
                    position: "top-right",
                    autoClose: 1500,
                    pauseOnHover: true,
                    closeOnClick: true,
                    hideProgressBar: true,
                });
                setMessage(`Transaction successful! Points earned: ${data.earned}`);

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
            <h2>Purchase Transaction</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>UTorID:</label>
                    <input
                        type="text"
                        value={utorid}
                        onChange={(e) => setUtorid(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Spent Amount:</label>
                    <input
                        type="number"
                        value={spent}
                        onChange={(e) => setSpent(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                    />
                </div>
                <div>
                    <label>Promotion IDs (comma separated):</label>
                    <input
                        type="text"
                        value={promotionIds}
                        onChange={(e) => setPromotionIds(e.target.value)}
                    />
                </div>
                <div>
                    <label>Remark:</label>
                    <input
                        type="text"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                    />
                </div>
                <button type="submit">Submit Transaction</button>
            </form>
        </div>
    );
};

export default PurchaseTransaction;