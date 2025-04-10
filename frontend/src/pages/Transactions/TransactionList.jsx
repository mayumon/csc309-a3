// TransferTransaction.jsx

// Transaction Listing:
// - Users can see their past transactions.
// - Managers can see ALL transactions.


import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const TransactionList = () => {
    const [transactions, setTransactions] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const endpoint = role === 'manager' ? '/transactions' : '/users/me/transactions';

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);

        try {
            const url = `${import.meta.env.VITE_BACKEND_URL}${endpoint}?page=${page}&limit=${limit}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                cache: 'no-store'
            });
            if (!response.ok) {
                throw new Error('Failed to load transactions.');
            }
            const data = await response.json();
            setTransactions(data.results || []);
        } catch (err) {
            setError(err.message);

            toast.error(err.message, {
                position: "top-right",
                autoClose: 1500,
                pauseOnHover: true,
                closeOnClick: true,
                hideProgressBar: true,
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTransactions();
    }, [page]);

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (transactions.length === limit) setPage(page + 1);
    };

    return (
        <div>
            <h2>Transaction List</h2>
            {loading && <p>Loading transactions…</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            <ul>
                {transactions.map((tx) => (
                    <li key={tx.id} style={{ marginBottom: '0.5rem' }}>
                        <strong>ID:</strong> {tx.id} | <strong>UTorID:</strong> {tx.utorid} | <strong>Type:</strong> {tx.type} | <strong>Amount:</strong> {tx.amount}
                        {tx.spent !== undefined && <span> | <strong>Spent:</strong> {tx.spent}</span>}
                        {tx.remark && <span> | <strong>Remark:</strong> {tx.remark}</span>}
                    </li>
                ))}
            </ul>

            <div>
                <button onClick={handlePrevPage} disabled={page === 1}>Previous</button>
                <span style={{ margin: '0 1rem' }}> Page {page} </span>
                <button onClick={handleNextPage} disabled={transactions.length < limit}>Next</button>
            </div>
        </div>
    );
};

export default TransactionList;