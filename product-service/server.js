const express = require('express');
const { PrismaClient } = require("@prisma/client");
// FIXED IMPORT BELOW
const { PrismaLibSql } = require('@prisma/adapter-libsql'); // Changed: lowercase 'ql'
const { createClient } = require("@libsql/client");

if (!process.env.DATABASE_URL) {
  require('dotenv').config();
}
const app = express();

console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');

app.use(express.json());

// Setup Connection
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaLibSql({url:dbUrl});
const prisma = new PrismaClient({ adapter });

// POST /products
app.post('/products', async (req, res) => {
    try {
        const { name, stock_quantity, company_id } = req.body;
        const product = await prisma.product.create({
            data: { 
                name, 
                stock_quantity: parseInt(stock_quantity), 
                company_id: parseInt(company_id) 
            }
        });
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /products
app.get('/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch products" });
    }
});

// POST /stock/update (Requirements: 9 & 11)
app.post('/stock/update', async (req, res) => {
    // In a POST request, data comes from req.body, not req.params
    const { product_id, change_amount, reason } = req.body; 

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. You must FETCH the product first to see current stock
            const product = await tx.product.findUnique({
                where: { id: parseInt(product_id) }
            });

            if (!product) throw new Error("Product not found");

            const newQuantity = product.stock_quantity + parseInt(change_amount);

            // Mandatory Business Rule: Never below zero
            if (newQuantity < 0) throw new Error("Insufficient stock: Values must never go negative");

            // 2. Update stock
            const updatedProduct = await tx.product.update({
                where: { id: parseInt(product_id) },
                data: { stock_quantity: newQuantity }
            });

            // 3. Create audit log (Mandatory)
            await tx.stockLog.create({
                data: {
                    product_id: parseInt(product_id),
                    change_amount: parseInt(change_amount),
                    reason: reason || "Stock update"
                }
            });

            return updatedProduct;
        });

        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Product service running on PORT ${PORT}`));