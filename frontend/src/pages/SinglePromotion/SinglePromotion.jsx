import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import './SinglePromotion.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
// import token from "../testing";

function SinglePromotion() {
    const [promotion, setPromotion] = useState({});
    const [error, setError] = useState('');

    const { user } = useAuth();
    // const user = {utorid: 'jarod123', role: 'superuser', currentRole: 'superuser'};
    const { promotionId } = useParams();
    const navigate = useNavigate();

    const hasManagerClearance = (user.currentRole === 'manager' || user.currentRole === 'superuser');

    useEffect(() => {
        async function getPromotion() {
            const token = localStorage.getItem('token');

            const res = await fetch(BACKEND_URL + '/promotions/' + promotionId, {
                method: 'GET',
                headers: {'Authorization': `Bearer ${token}`},
            });

            if(res.status === 401) {
                setError('Error 401: Please login to see promotions');
            }
            else if(res.status === 404) {
                setError('Error 404: Promotion not found');
            }
            else if(res.status !== 200) {
                setError('Error 500: Internal server error. Please try again later');
            }
            else {
                const body = await res.json();
                setPromotion(body);
                setError('');
            }
        }

        getPromotion();
    }, []);

    return <div id="singlePromotionContainer">
        <h1>{promotion.name}</h1>
        <div>Description: {promotion.description}</div>
        <div>Type: {promotion.type}</div>
        {hasManagerClearance && <div>Start Time: {formatDate(promotion.startTime)}</div>}
        <div>End Time: {formatDate(promotion.endTime)}</div>
        <div>Minimum Spending: {promotion.minSpending}</div>
        <div>Rate: {promotion.rate}</div>
        <div>Points: {promotion.points}</div>
        <button onClick={() => navigate('/allpromotions')}>Back to Promotions</button>
        <p className="promotionError">{error}</p>
    </div>
}

export default SinglePromotion;