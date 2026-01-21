const express = require('express');
const {createProxyMiddleware} = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET ||'super_secret_raven_2026';

//middleware
const authenticateToken = (req, res, next) =>{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token) return res.status(401).json({error:"Access denied. No token provided."});

    jwt.verify(token, JWT_SECRET, (err, user)=>{
        if(err) return res.status(403).json({error:"invalid or expired token."});
        req.user=user;
        next();
    });
};

app.use('/auth', createProxyMiddleware({
    target:'http://localhost:3001',
    changeOrigin:true,
}));

app.use('/products', authenticateToken, createProxyMiddleware({
    target:'http://localhost:3002',
    changeOrigin:true
}));

app.use('/stock', authenticateToken, createProxyMiddleware({
    target:'http://localhost:3002',
    changeOrigin:true
}));

app.listen(PORT, ()=>{
    console.log(`API gateway running on http://localhost:${PORT}`);
    console.log(`Forwarding /auth to port 3001`);
    console.log(`Forwarding /products and /stock to port 3002`);
});