import { Transaction, Provider } from "../../../prisma/db-models.js";

const getTransactionByOrderId = async (order_id) => {
    const transaction = await Transaction.findFirst({
        where: {
            order_id: order_id,
        },
        orderBy: {
            created_at: "desc"
        }
    });
    return transaction;
};

const updateTransactionStatus = async (transaction_id, status, payment_id = null) => {
    const updateData = {
        transaction_status: status,
        updated_at: new Date(),
    };
    if (payment_id) {
        updateData.transaction_id = payment_id;
    }
    const transaction = await Transaction.update({
        where: {
            id: transaction_id,
        },
        data: updateData,
    });
    return transaction;
};

const createTransactionForOrderId = async (order_id, provider_id, amount, status, payment_id = null, transaction_status = "Pending") => {
    const transaction = await Transaction.create({
        data: {
            provider_id: provider_id,
            order_id: order_id,
            order_status: status,
            amount: amount,
            type: "Subscription",
            transaction_type: "Online",
            transaction_status: transaction_status,
            transaction_id: payment_id,
        }
    });
    return transaction;
};

const getProviderByOrderId = async (order_id) => {
    const transaction = await Transaction.findFirst({
        where: {
            order_id: order_id,
        },
        include: {
            provider: true,
        }
    });
    return transaction?.provider || null;
};

const activateSubscriptionByOrderId = async (order_id) => {
    return null;
};

export {
    getTransactionByOrderId,
    updateTransactionStatus,
    createTransactionForOrderId,
    getProviderByOrderId,
    activateSubscriptionByOrderId,
};
