const express = require('express');
const router = express.Router();
const pool = require('../db'); // Import your database connection

// Adding funds
router.post('/api/wallet/add', async (req, res) => {
    const { userId, amountToAdd } = req.body;
    
    // Grab a dedicated client connection for this transaction
    const client = await pool.connect();

    try {
        // 1. Lock the database for these specific changes
        await client.query('BEGIN');

        // 2. Add the money directly to the current balance
        await client.query(`
            UPDATE users 
            SET balance = balance + $1 
            WHERE id = $2
        `, [amountToAdd, userId]);

        // 3. Write the receipt to the ledger
        await client.query(`
            INSERT INTO ledger (user_id, amount, transaction_type) 
            VALUES ($1, $2, 'deposit')
        `, [userId, amountToAdd]);

        // 4. Save both changes permanently
        await client.query('COMMIT');
        
        res.json({ status: "success", message: "Funds added securely." });

    } catch (error) {
        // If anything breaks above, erase all changes made since BEGIN
        await client.query('ROLLBACK');
        res.status(500).json({ status: "error", message: "Transaction failed." });
        
    } finally {
        // Always release the connection back to the pool
        client.release();
    }
});

// Purchasing products
router.post('/api/wallet/purchase', async (req, res) => {
    const { userId, baseCost, itemName } = req.body;
    const taxRate = parseFloat(process.env.TAX_RATE || 0.13); // Pull from .env
    
    // Calculate exact amounts
    const taxAmount = baseCost * taxRate;
    const grandTotal = baseCost + taxAmount;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Lock the user's row and check balance against the GRAND TOTAL
        const userRes = await client.query(`
            SELECT balance FROM users 
            WHERE id = $1 FOR UPDATE
        `, [userId]);

        const currentBalance = parseFloat(userRes.rows[0].balance);

        if (currentBalance < grandTotal) {
            await client.query('ROLLBACK');
            return res.status(402).json({ status: "error", message: "Insufficient funds." });
        }

        // 2. Deduct the grand total from the wallet
        await client.query(`
            UPDATE users 
            SET balance = balance - $1 
            WHERE id = $2
        `, [grandTotal, userId]);

        // 3. Write the itemized receipt to the ledger
        await client.query(`
            INSERT INTO ledger (user_id, amount, transaction_type, base_amount, tax_amount) 
            VALUES ($1, $2, $3, $4, $5)
        `, [userId, -grandTotal, `purchase_${itemName}`, baseCost, taxAmount]);

        await client.query('COMMIT');
        
        res.json({ 
            status: "success", 
            receipt: {
                item: itemName,
                base: baseCost,
                tax: taxAmount,
                total: grandTotal
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ status: "error", message: "Transaction failed." });
    } finally {
        client.release();
    }
});

module.exports = router;