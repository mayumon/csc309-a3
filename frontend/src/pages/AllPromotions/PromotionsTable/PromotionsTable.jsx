import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./PromotionsTable.css";

function formatDate(isoDateStr) {
    const dateObj = new Date(isoDateStr);
    return dateObj.toLocaleString();
}

function PromotionsTable({ promotions }) {
    const { user } = useAuth();
    // const user = {role: 'superuser', currentRole: 'superuser'};
    const navigate = useNavigate();

    if(user.currentRole === 'manager' || user.currentRole === 'superuser') {
        return <table id="allPromotionTable">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Start Time (Toronto Time)</th>
                    <th>End Time (Toronto Time)</th>
                    <th>Minimum Spending</th>
                    <th>Rate</th>
                    <th>Points Awarded</th>
                </tr>
            </thead>
            <tbody>
                {promotions.map(promotion => (
                    <tr key={promotion.id} onClick={() => navigate('/promotions/' + String(promotion.id))}>
                        <td>{promotion.name}</td>
                        <td>{promotion.type}</td>
                        <td>{formatDate(promotion.startTime)}</td>
                        <td>{formatDate(promotion.endTime)}</td>
                        <td>{promotion.minSpending}</td>
                        <td>{promotion.rate}</td>
                        <td>{promotion.points}</td>
                    </tr>
                ))}
            </tbody>
        </table>;
    }
    else {
        return <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>End Time (Toronto Time)</th>
                    <th>Minimum Spending</th>
                    <th>Rate</th>
                    <th>Points Awarded</th>
                </tr>
            </thead>
            <tbody>
                {promotions.map(promotion => (
                    <tr key={promotion.id} onClick={() => navigate('/promotions/' + String(promotion.id))}>
                        <td>{promotion.name}</td>
                        <td>{promotion.type}</td>
                        <td>{formatDate(promotion.endTime)}</td>
                        <td>{promotion.minSpending}</td>
                        <td>{promotion.rate}</td>
                        <td>{promotion.points}</td>
                    </tr>
                ))}
            </tbody>
        </table>;
    }
}

export default PromotionsTable;