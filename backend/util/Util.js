const errorMessage = (message) => {
	console.log(message);
	return { error: message };
};

const tryCatchWrapper = (fn) => (req, res, next) => {
	Promise.resolve(fn(req, res, next)).catch(next);
};

const ROLES = ["regular", "cashier", "eventOrganizer", "manager", "superuser"];
const clearanceList = (role) => {
	if (role === "any") {
		return ROLES;
	}
	var index = ROLES.indexOf(role);
	return ROLES.slice(index, ROLES.length);
};

const isPresentInvalidFields = (req, allowedFields) => {
	const requestKeys = Object.keys(req);
	const extraFields = requestKeys.filter((key) => !allowedFields.includes(key));

	if (extraFields.length > 0) {
		return true;
	}
	return false;
};

const isISOFormat = (dateStr) => {
	// const isoFormatRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;
	// const isoFormatRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}\+\d{2}:\d{2}/;
	// if (!isoFormatRegex.test(dateStr)) {
	//     return false;
	// }
	const date = new Date(dateStr);
	const isRightTime = !isNaN(date.getTime());
	// const isRightDate = date.toISOString() === dateStr;
	// return isRightTime && isRightDate;
	return isRightTime;
};

const formatTransaction = (transaction) => {
	if (transaction.type === "purchase") {
		return {
			id: transaction.id,
			utorid: transaction.utorid,
			amount: transaction.amount,
			type: transaction.type,
			spent: transaction.spent,
			promotionIds: transaction.promotionIds.map((promotion) => promotion.id),
			suspicious: transaction.suspicious,
			remark: transaction.remark,
			createdBy: transaction.createdBy,
		};
	} else if (transaction.type === "redemption") {
		var redeemed = null;
		if (transaction.relatedId !== null) {
			redeemed = transaction.amount * -1;
		}

		return {
			id: transaction.id,
			utorid: transaction.utorid,
			amount: transaction.amount,
			type: transaction.type,
			relatedId: transaction.relatedId,
			promotionIds: transaction.promotionIds.map((promotion) => promotion.id),
			redeemed: redeemed,
			remark: transaction.remark,
			createdBy: transaction.createdBy,
		};
	} else if (transaction.type === "adjustment") {
		return {
			id: transaction.id,
			utorid: transaction.utorid,
			amount: transaction.amount,
			type: transaction.type,
			relatedId: transaction.relatedId,
			promotionIds: transaction.promotionIds.map((promotion) => promotion.id),
			suspicious: transaction.suspicious,
			remark: transaction.remark,
			createdBy: transaction.createdBy,
		};
	} else if (transaction.type === "transfer") {
		return {
			id: transaction.id,
			sender: transaction.utorid,
			recipient: transaction.relatedId,
			type: transaction.type,
			sent: transaction.amount * -1,
			remark: transaction.remark,
			createdBy: transaction.createdBy,
		};
	} else if (transaction.type === "event") {
		return {
			id: transaction.id,
			recipient: transaction.utorid,
			awarded: transaction.amount,
			type: transaction.type,
			relatedId: transaction.relatedId,
			remark: transaction.remark,
			createdBy: transaction.createdBy,
		};
	} else {
		return transaction;
	}
};

const formatTransactionForSelf = (transaction) => {
	if (transaction.type === "purchase") {
		return {
			id: transaction.id,
			type: transaction.type,
			spent: transaction.spent,
			amount: transaction.amount,
			promotionIds: transaction.promotionIds.map((promotion) => promotion.id),
			remark: transaction.remark,
			createdBy: transaction.createdBy,
		};
	} else if (transaction.type === "redemption") {
		var redeemed = null;
		if (transaction.relatedId !== null) {
			redeemed = transaction.amount * -1;
		}

		return {
			id: transaction.id,
			amount: transaction.amount,
			type: transaction.type,
			relatedId: transaction.relatedId,
			promotionIds: transaction.promotionIds.map((promotion) => promotion.id),
			redeemed: redeemed,
			remark: transaction.remark,
			createdBy: transaction.createdBy,
		};
	} else if (transaction.type === "adjustment") {
		return {
			id: transaction.id,
			amount: transaction.amount,
			type: transaction.type,
			relatedId: transaction.relatedId,
			promotionIds: transaction.promotionIds.map((promotion) => promotion.id),
			remark: transaction.remark,
			createdBy: transaction.createdBy,
		};
	} else if (transaction.type === "transfer") {
		return {
			id: transaction.id,
			amount: transaction.amount,
			type: transaction.type,
			relatedId: transaction.relatedId,
			promotionIds: transaction.promotionIds.map((promotion) => promotion.id),
			remark: transaction.remark,
			createdBy: transaction.createdBy,
		};
	} else {
		return transaction;
	}
};

module.exports = {
	errorMessage,
	clearanceList,
	isPresentInvalidFields,
	isISOFormat,
	formatTransaction,
	formatTransactionForSelf,
	tryCatchWrapper,
};
