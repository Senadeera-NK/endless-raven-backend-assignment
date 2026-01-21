const express = require('express');
const {createProxyMiddleware} = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
require('dotenv').config();

//auth and product urls
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

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

//health check
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        gateway: 'OK',
        timestamp: new Date().toISOString()
    });
});

//for auth
app.use('/auth', createProxyMiddleware({
    target:AUTH_SERVICE_URL,
    changeOrigin:true,
}));
app.use(['/products', '/stock'], authenticateToken);

//for product
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

// for stock
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