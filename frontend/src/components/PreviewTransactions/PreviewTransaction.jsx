import "./PreviewTransaction.css";

function PreviewTransaction({ transactions }) {
	return (
		<div className="transaction-table-rounded-corners-wrapper">
			<div className="transaction-table-wrapper">
				<table className="transaction-table">
					<thead>
						<tr>
							<th>Amount</th>
							<th>Spent</th>
							<th>Type</th>
						</tr>
					</thead>

					<tbody>
						{transactions.map((tx, index) => (
							<tr key={index}>
								<td>{tx.amount}</td>
								<td>{tx.spent ? tx.spent : "-"}</td>
								<td>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</td>
							</tr>
						))}
					</tbody>
				</table>
				{transactions.length === 0 ? (
					<div className="empty-label-container">
						<p className="empty-label">No Transactions Yet!</p>
					</div>
				) : (
					<></>
				)}
			</div>
		</div>
	);
}
export default PreviewTransaction;
