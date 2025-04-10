// RedemptionQRCode.jsx
// A QR code used to identify a redemption request, so that a cashier can process it.

import React from "react";
import { QRCodeSVG } from "qrcode.react";

const RedemptionQRCode = ({ redemptionId }) => {
	// only redemptionId is used

	const qrValue = redemptionId ? String(redemptionId) : "No redemption request";

	return (
		<div>
			<h3>Redemption Request QR Code</h3>
			{redemptionId ? (
				<QRCodeSVG value={qrValue} size={256} level="H" includeMargin={true} />
			) : (
				<p>No active redemption request to show.</p>
			)}
		</div>
	);
};

export default RedemptionQRCode;
