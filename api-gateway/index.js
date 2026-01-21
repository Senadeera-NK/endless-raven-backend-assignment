const express = require('express');
const {createProxyMiddleware} = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET ||'super_secret_raven_2026';

// Log EVERY incoming request
app.use((req, res, next) => {
    console.log('========================================');
    console.log('INCOMING REQUEST:', req.method, req.url);
    console.log('Headers:', req.headers);
    console.log('========================================');
    next();
});


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

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

console.log('========================================');
console.log('AUTH_SERVICE_URL:', AUTH_SERVICE_URL);
console.log('PRODUCT_SERVICE_URL:', PRODUCT_SERVICE_URL);
console.log('========================================');

app.use('/auth', createProxyMiddleware({
    target:AUTH_SERVICE_URL,
    changeOrigin:true,
}));
app.use(['/products', '/stock'], authenticateToken);

// 2. Transparent Proxy for Products
app.use(createProxyMiddleware({
    pathFilter: '/products',
    target: PRODUCT_SERVICE_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        console.log('>>> PROXYING PRODUCT:', req.method, PRODUCT_SERVICE_URL + req.url);
    },
    onError: (err, req, res) => {
        console.error('>>> PROXY ERROR:', err.message);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}));

// 3. Transparent Proxy for Stock
app.use(createProxyMiddleware({
    pathFilter: '/stock',
    target: PRODUCT_SERVICE_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        console.log('>>> PROXYING STOCK:', req.method, PRODUCT_SERVICE_URL + req.url);
    }
}));
app.listen(PORT, ()=>{
    console.log(`API gateway running on http://localhost:${PORT}`);
    console.log(`Forwarding /auth to port 3001`);
    console.log(`Forwarding /products and /stock to port 3002`);
});